// tests/deploiement.test.js — fonctionnement derrière un proxy (Docker / nginx)
const h = require('./helpers');
const { test, describe, before, after, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

let app;
before(async () => {
  await h.reinitialiserBase();
  app = h.charger().app;
  await h.creerUtilisateur('patient', { email: 'proxy@x.sn', password: 'motdepasse1' });
});
after(h.fermer);

const trustAvant = () => app.get('trust proxy');
let sauvegarde;
afterEach(() => {
  if (sauvegarde) { app.set('trust proxy', sauvegarde.trust); process.env.COOKIE_SECURE = sauvegarde.secure; }
  if (sauvegarde?.secure === undefined) delete process.env.COOKIE_SECURE;
  sauvegarde = null;
});
const configurer = (trust, secure) => {
  sauvegarde = { trust: trustAvant(), secure: process.env.COOKIE_SECURE };
  app.set('trust proxy', trust);
  process.env.COOKIE_SECURE = secure;
};

const cookieSession = (res) => (res.headers['set-cookie'] || []).find(c => c.startsWith('medconnect_refresh='));
const connexion = (proto) => {
  const r = request(app).post('/api/auth/login').send({ email: 'proxy@x.sn', password: 'motdepasse1' });
  return proto ? r.set('X-Forwarded-Proto', proto) : r;
};

describe('Santé du service', () => {
  test('GET /api/health répond 200 quand la base répond', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'ok' });
  });
});

describe('Derrière nginx (TRUST_PROXY=1)', () => {
  test('la limite anti brute-force compte par visiteur, pas pour le proxy entier', async () => {
    configurer(1, 'auto');
    const express = require('express');
    const { rateLimit } = h.charger();
    const mini = express().set('trust proxy', 1).use(rateLimit(2, 60_000)).get('/', (req, res) => res.json(req.ip));
    const de = (ip) => request(mini).get('/').set('X-Forwarded-For', ip);
    assert.equal((await de('41.82.1.1')).status, 200);
    assert.equal((await de('41.82.1.1')).status, 200);
    assert.equal((await de('41.82.1.1')).status, 429, 'le même visiteur est limité');
    assert.equal((await de('41.82.2.2')).status, 200, 'un autre visiteur ne l\'est pas');
    // Un visiteur ne peut pas se faire passer pour un autre : nginx ajoute la vraie IP à la fin
    assert.equal((await de('41.82.2.2, 41.82.1.1')).status, 429);
  });

  test('COOKIE_SECURE=auto : cookie Secure en HTTPS, pas en HTTP', async () => {
    configurer(1, 'auto');
    const https = cookieSession(await connexion('https'));
    const http = cookieSession(await connexion('http'));
    assert.match(https, /;\s*Secure/i);
    assert.doesNotMatch(http, /;\s*Secure/i);
    assert.match(http, /HttpOnly/i);
  });

  test('sans proxy de confiance, X-Forwarded-Proto est ignoré', async () => {
    configurer(false, 'auto');
    assert.doesNotMatch(cookieSession(await connexion('https')), /;\s*Secure/i);
  });

  test('la déconnexion efface le cookie avec les mêmes options', async () => {
    configurer(1, 'auto');
    const login = await connexion('https');
    const cookie = cookieSession(login).split(';')[0];
    const res = await request(app).post('/api/auth/logout').set('X-Forwarded-Proto', 'https').set('Cookie', cookie);
    assert.equal(res.status, 200);
    const efface = cookieSession(res);
    assert.match(efface, /Expires=Thu, 01 Jan 1970/);
    assert.match(efface, /Path=\/api\/auth/);
  });
});
