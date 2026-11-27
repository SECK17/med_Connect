// tests/auth.test.js — inscription, vérification d'email, connexion, mot de passe oublié
const h = require('./helpers');
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

let app;
before(async () => {
  await h.reinitialiserBase();
  app = h.charger().app;
});
after(h.fermer);

const inscrire = (body) => request(app).post('/api/auth/register').send({
  nom: 'Awa Diop', telephone: '770000000', password: 'motdepasse1', role: 'patient', ...body,
});
const connecter = (email, password = 'motdepasse1') =>
  request(app).post('/api/auth/login').send({ email, password });

describe('Inscription', () => {
  test('refuse les rôles réservés (admin, admin_hopital)', async () => {
    for (const role of ['admin', 'admin_hopital']) {
      const res = await inscrire({ email: `${role}@x.sn`, role });
      assert.equal(res.status, 400, role);
      assert.match(res.body.message, /Rôle non autorisé/);
    }
  });

  test('refuse un mot de passe de moins de 8 caractères', async () => {
    const res = await inscrire({ email: 'court@x.sn', password: 'abc' });
    assert.equal(res.status, 400);
  });

  test('crée le compte sans jeton de connexion et envoie un lien de vérification', async () => {
    const res = await inscrire({ email: 'awa@x.sn' });
    assert.equal(res.status, 201);
    assert.equal(res.body.token, undefined);
    assert.ok(h.dernierEmail('awa@x.sn', 'verify-email'), 'email de vérification envoyé');
  });

  test('refuse un email déjà utilisé', async () => {
    const res = await inscrire({ email: 'awa@x.sn' });
    assert.equal(res.status, 400);
  });
});

describe('Vérification d\'email', () => {
  test('connexion refusée tant que l\'email n\'est pas confirmé', async () => {
    const res = await connecter('awa@x.sn');
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'EMAIL_NON_VERIFIE');
  });

  test('un faux lien est refusé', async () => {
    const res = await request(app).post('/api/auth/verify-email').send({ token: 'faux' });
    assert.equal(res.status, 400);
  });

  test('le lien de vérification ne peut pas servir de jeton de connexion', async () => {
    const { token } = h.dernierEmail('awa@x.sn', 'verify-email');
    const res = await request(app).get('/api/messages').set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 401);
  });

  test('renvoyer le lien donne la même réponse, que le compte existe ou non', async () => {
    const a = await request(app).post('/api/auth/resend-verification').send({ email: 'awa@x.sn' });
    const b = await request(app).post('/api/auth/resend-verification').send({ email: 'inconnu@x.sn' });
    assert.equal(a.status, 200);
    assert.deepEqual(a.body, b.body);
  });

  test('le bon lien confirme l\'email, puis la connexion fonctionne', async () => {
    const { token } = h.dernierEmail('awa@x.sn', 'verify-email');
    const v = await request(app).post('/api/auth/verify-email').send({ token });
    assert.equal(v.status, 200);
    const res = await connecter('awa@x.sn');
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
  });
});

describe('Connexion', () => {
  test('email inconnu ou mauvais mot de passe : même réponse (pas de fuite des comptes)', async () => {
    const inconnu = await connecter('personne@x.sn', 'motdepasse1');
    const mauvais = await connecter('awa@x.sn', 'mauvaismdp1');
    assert.equal(inconnu.status, 400);
    assert.equal(mauvais.status, 400);
    assert.deepEqual(inconnu.body, mauvais.body);
  });
});

describe('Mot de passe oublié', () => {
  test('même réponse pour un email existant ou inconnu (pas de fuite des comptes)', async () => {
    const a = await request(app).post('/api/auth/forgot-password').send({ email: 'AWA@x.sn' });
    const b = await request(app).post('/api/auth/forgot-password').send({ email: 'inconnu@x.sn' });
    assert.equal(a.status, 200);
    assert.deepEqual(a.body, b.body);
    assert.equal(h.dernierEmail('inconnu@x.sn', 'reset-password'), undefined);
  });

  test('le lien fonctionne une seule fois', async () => {
    const { token } = h.dernierEmail('awa@x.sn', 'reset-password');
    const court = await request(app).post('/api/auth/reset-password').send({ token, password: 'abc' });
    assert.equal(court.status, 400);

    const ok = await request(app).post('/api/auth/reset-password').send({ token, password: 'nouveaumdp9' });
    assert.equal(ok.status, 200);

    const encore = await request(app).post('/api/auth/reset-password').send({ token, password: 'autremdp99' });
    assert.equal(encore.status, 400, 'le lien ne doit plus être valable');

    assert.equal((await connecter('awa@x.sn', 'motdepasse1')).status, 400, 'ancien mot de passe refusé');
    assert.equal((await connecter('awa@x.sn', 'nouveaumdp9')).status, 200, 'nouveau mot de passe accepté');
  });
});

describe('Limite anti brute-force', () => {
  test('bloque au-delà du nombre de requêtes autorisé', async () => {
    const express = require('express');
    const { rateLimit } = h.charger();
    const mini = express().use(rateLimit(3, 60_000)).get('/', (req, res) => res.sendStatus(200));
    const codes = [];
    for (let i = 0; i < 5; i++) codes.push((await request(mini).get('/')).status);
    assert.deepEqual(codes, [200, 200, 200, 429, 429]);
  });
});
