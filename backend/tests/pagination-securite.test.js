// tests/pagination-securite.test.js — pagination optionnelle, CORS, en-têtes de sécurité, erreurs
const h = require('./helpers');
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

let app, admin;

before(async () => {
  await h.reinitialiserBase();
  app = h.charger().app;
  admin = await h.creerUtilisateur('admin');
  const p1 = await h.creerUtilisateur('patient');
  const p2 = await h.creerUtilisateur('patient');
  const dr = await h.creerUtilisateur('medecin', { nom: 'Dr Fall' });
  await h.creerUtilisateur('medecin', { nom: 'Dr Sans Avis' });
  const { Evaluation } = h.charger().models;
  await Evaluation.create({ patient_id: p1.user.id, medecin_id: dr.user.id, note: 4 });
  await Evaluation.create({ patient_id: p2.user.id, medecin_id: dr.user.id, note: 5 });
});
after(h.fermer);

const get = (u) => request(app).get(u).set('Authorization', `Bearer ${admin.token}`);

describe('Pagination optionnelle', () => {
  test('sans paramètres : liste complète, comme avant', async () => {
    const res = await get('/api/users');
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 5);
    assert.equal(res.headers['x-total-count'], undefined);
  });

  test('avec ?page et ?limit : tranche + en-têtes de total', async () => {
    const p1 = await get('/api/users?page=1&limit=2');
    const p3 = await get('/api/users?page=3&limit=2');
    assert.equal(p1.body.length, 2);
    assert.equal(p3.body.length, 1);
    assert.equal(p1.headers['x-total-count'], '5');
    assert.equal(p1.headers['x-total-pages'], '3');
    const ids = [...p1.body, ...(await get('/api/users?page=2&limit=2')).body, ...p3.body].map(u => u.id);
    assert.equal(new Set(ids).size, 5, 'aucun doublon entre les pages');
  });

  test('la limite est plafonnée à 100', async () => {
    const res = await get('/api/users?limit=99999');
    assert.equal(res.headers['x-limit'], '100');
  });
});

describe('Notes des médecins', () => {
  test('moyenne et nombre d\'avis calculés en SQL', async () => {
    const res = await request(app).get('/api/medecins');
    const fall = res.body.find(m => m.nom === 'Dr Fall');
    const sans = res.body.find(m => m.nom === 'Dr Sans Avis');
    assert.equal(fall.note, 4.5);
    assert.equal(fall.nbEvals, 2);
    assert.equal(sans.note, 0);
    assert.equal(sans.nbEvals, 0);
  });
});

describe('Sécurité HTTP', () => {
  test('CORS : origine inconnue refusée, frontend autorisé, en-têtes de pagination exposés', async () => {
    const evil = await request(app).get('/').set('Origin', 'https://evil.com');
    assert.equal(evil.headers['access-control-allow-origin'], undefined);
    const ok = await request(app).get('/').set('Origin', 'http://localhost:5173');
    assert.equal(ok.headers['access-control-allow-origin'], 'http://localhost:5173');
    assert.match(ok.headers['access-control-expose-headers'], /X-Total-Count/);
  });

  test('en-têtes helmet présents', async () => {
    const res = await request(app).get('/');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.ok(res.headers['x-frame-options']);
  });

  test('JSON invalide : 400 avec un message clair', async () => {
    const res = await request(app).post('/api/auth/login')
      .set('Content-Type', 'application/json').send('{mauvais');
    assert.equal(res.status, 400);
    assert.equal(res.body.message, 'JSON invalide.');
  });

  test('route inconnue : 404', async () => {
    assert.equal((await request(app).get('/api/nexiste-pas')).status, 404);
  });
});
