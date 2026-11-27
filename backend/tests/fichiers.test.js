// tests/fichiers.test.js — accès aux fichiers médicaux (/uploads)
const h = require('./helpers');
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const fs = require('fs');
const path = require('path');

const NOM = `test-${process.pid}.pdf`;
const CHEMIN = path.join(__dirname, '../uploads/ordonnances', NOM);

let app, awa, moussa, admin, drFall, drBa;

before(async () => {
  await h.reinitialiserBase();
  app = h.charger().app;
  awa    = await h.creerUtilisateur('patient');
  moussa = await h.creerUtilisateur('donneur');
  admin  = await h.creerUtilisateur('admin');
  drFall = await h.creerUtilisateur('medecin');
  drBa   = await h.creerUtilisateur('medecin');
  fs.mkdirSync(path.dirname(CHEMIN), { recursive: true });
  fs.writeFileSync(CHEMIN, '%PDF-test');
  await h.charger().models.Ordonnance.create({
    patient_id: awa.user.id, medecin_id: drFall.user.id,
    fichier: `uploads/ordonnances/${NOM}`, date: new Date().toISOString().split('T')[0],
  });
});
after(async () => {
  fs.rmSync(CHEMIN, { force: true });
  await h.fermer();
});

const url = `/uploads/ordonnances/${NOM}`;

describe('Fichiers d\'ordonnances', () => {
  test('sans jeton ou avec un faux jeton : 401', async () => {
    assert.equal((await request(app).get(url)).status, 401);
    assert.equal((await request(app).get(`${url}?token=faux`)).status, 401);
  });

  test('autorisé : patient propriétaire, médecin auteur, admin (en-tête ou ?token=)', async () => {
    for (const qui of [awa, drFall, admin]) {
      assert.equal((await request(app).get(`${url}?token=${qui.token}`)).status, 200);
    }
    const viaEntete = await request(app).get(url).set('Authorization', `Bearer ${awa.token}`);
    assert.equal(viaEntete.status, 200);
    assert.equal(viaEntete.headers['cache-control'], 'private, no-store');
  });

  test('refusé : autre utilisateur, médecin sans lien', async () => {
    for (const qui of [moussa, drBa]) {
      assert.equal((await request(app).get(`${url}?token=${qui.token}`)).status, 403);
    }
  });

  test('les justificatifs d\'hôpitaux sont réservés à l\'admin', async () => {
    const res = await request(app).get(`/uploads/demandes/x.pdf?token=${awa.token}`);
    assert.equal(res.status, 403);
  });

  test('la traversée de répertoire est bloquée', async () => {
    const res = await request(app).get(`/uploads/ordonnances/..%2F..%2F.env?token=${admin.token}`);
    assert.equal(res.status, 400);
  });
});
