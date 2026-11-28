// tests/premier-admin.test.js — la création du premier admin n'est possible qu'une fois
const h = require('./helpers');
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const CODE = 'code-admin-de-test-123';
let app;
before(async () => {
  process.env.ADMIN_CODE = CODE;
  await h.reinitialiserBase();
  app = h.charger().app;
});
after(h.fermer);

let n = 0;
const premierAdmin = (body = {}) => {
  n += 1;
  return request(app).post('/api/auth/create-first-admin').send({
    nom: 'Admin', email: `admin${n}@x.sn`, password: 'motdepasse1', telephone: '770000000',
    adminCode: CODE, ...body,
  });
};

describe('Création du premier admin', () => {
  test('refuse un mauvais code', async () => {
    const res = await premierAdmin({ adminCode: 'mauvais-code' });
    assert.equal(res.status, 403);
    assert.match(res.body.message, /Code administrateur invalide/);
  });

  test('crée le premier admin avec le bon code', async () => {
    const res = await premierAdmin();
    assert.equal(res.status, 201);
    assert.equal(res.body.user.role, 'admin');
  });

  test('refuse un deuxième admin, même avec le bon code', async () => {
    const res = await premierAdmin();
    assert.equal(res.status, 403);
    assert.match(res.body.message, /existe déjà/);
    const { User } = h.charger().models;
    assert.equal(await User.count({ where: { role: 'admin' } }), 1);
  });

  test('deux demandes simultanées sur une base sans admin ne créent qu’un seul admin', async () => {
    const { User } = h.charger().models;
    await User.destroy({ where: { role: 'admin' } });
    const reponses = await Promise.all([premierAdmin(), premierAdmin(), premierAdmin()]);
    assert.deepEqual(reponses.map(r => r.status).sort(), [201, 403, 403]);
    assert.equal(await User.count({ where: { role: 'admin' } }), 1);
  });

  test('un admin existant peut toujours créer d’autres admins', async () => {
    const { token } = await h.creerUtilisateur('admin');
    const res = await request(app).post('/api/auth/create-admin')
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'Second', email: 'second-admin@x.sn', password: 'motdepasse1', telephone: '770000000' });
    assert.equal(res.status, 201);
  });
});
