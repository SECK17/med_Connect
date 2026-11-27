// tests/acces-patient.test.js — qui peut lire / modifier le dossier d'un patient
const h = require('./helpers');
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

let app, awa, moussa, admin, drFall, drSow, drBa;

before(async () => {
  await h.reinitialiserBase();
  app = h.charger().app;
  awa    = await h.creerUtilisateur('patient', { nom: 'Awa' });
  moussa = await h.creerUtilisateur('donneur', { nom: 'Moussa' });
  admin  = await h.creerUtilisateur('admin');
  drFall = await h.creerUtilisateur('medecin', { nom: 'Dr Fall' }); // a un RDV avec Awa
  drSow  = await h.creerUtilisateur('medecin', { nom: 'Dr Sow' });  // Awa lui a partagé son dossier
  drBa   = await h.creerUtilisateur('medecin', { nom: 'Dr Ba' });   // aucun lien avec Awa
  await h.creerRdv(awa.user.id, drFall.user.id);
  await h.charger().models.DossierPartage.create({ patient_id: awa.user.id, medecin_id: drSow.user.id });
});
after(h.fermer);

const get = (url, qui) => request(app).get(url).set('Authorization', `Bearer ${qui.token}`);

describe('Lecture du dossier d\'un patient', () => {
  const routes = (id) => [
    `/api/rendezvous/patient/${id}`,
    `/api/ordonnances/patient/${id}`,
    `/api/analyses/patient/${id}`,
    `/api/consultations/patient/${id}`,
    `/api/partages/patient/${id}`,
    `/api/patients/${id}`,
  ];

  test('autorisé : le patient, l\'admin, un médecin avec RDV ou dossier partagé', async () => {
    for (const qui of [awa, admin, drFall, drSow]) {
      for (const url of routes(awa.user.id)) {
        assert.equal((await get(url, qui)).status, 200, `${qui.user.nom} → ${url}`);
      }
    }
  });

  test('refusé : un donneur ou un médecin sans lien', async () => {
    for (const qui of [moussa, drBa]) {
      for (const url of routes(awa.user.id)) {
        assert.equal((await get(url, qui)).status, 403, `${qui.user.nom} → ${url}`);
      }
    }
  });

  test('sans jeton : 401', async () => {
    const res = await request(app).get(`/api/ordonnances/patient/${awa.user.id}`);
    assert.equal(res.status, 401);
  });
});

describe('Données d\'un médecin', () => {
  const routes = (id) => [
    `/api/rendezvous/medecin/${id}`,
    `/api/ordonnances/medecin/${id}`,
    `/api/analyses/medecin/${id}`,
    `/api/consultations/medecin/${id}`,
    `/api/partages/medecin/${id}`,
  ];

  test('seuls le médecin lui-même et l\'admin y ont accès', async () => {
    for (const url of routes(drFall.user.id)) {
      assert.equal((await get(url, drFall)).status, 200, `Dr Fall → ${url}`);
      assert.equal((await get(url, admin)).status, 200, `admin → ${url}`);
      for (const qui of [awa, moussa, drBa]) {
        assert.equal((await get(url, qui)).status, 403, `${qui.user.nom} → ${url}`);
      }
    }
  });
});

describe('Modification du dossier patient', () => {
  test('un donneur ne peut pas modifier le dossier d\'un autre patient', async () => {
    const res = await request(app).put(`/api/patients/${awa.user.id}`)
      .set('Authorization', `Bearer ${moussa.token}`).send({ allergies: ['piraté'] });
    assert.equal(res.status, 403);
  });

  test('le patient peut modifier son propre dossier', async () => {
    const res = await request(app).put(`/api/patients/${awa.user.id}`)
      .set('Authorization', `Bearer ${awa.token}`).send({ allergies: ['pénicilline'] });
    assert.equal(res.status, 200);
  });
});

describe('Création d\'ordonnances / consultations / analyses', () => {
  const ordonnance = { medicaments: [{ nom: 'Paracétamol' }] };

  test('un médecin qui suit le patient peut créer', async () => {
    for (const dr of [drFall, drSow]) {
      const res = await request(app).post('/api/ordonnances')
        .set('Authorization', `Bearer ${dr.token}`).send({ ...ordonnance, patient_id: awa.user.id });
      assert.equal(res.status, 201, dr.user.nom);
    }
    const c = await request(app).post('/api/consultations')
      .set('Authorization', `Bearer ${drFall.token}`).send({ patient_id: awa.user.id, motif: 'Contrôle' });
    assert.equal(c.status, 201);
  });

  test('un médecin sans lien est refusé', async () => {
    const o = await request(app).post('/api/ordonnances')
      .set('Authorization', `Bearer ${drBa.token}`).send({ ...ordonnance, patient_id: awa.user.id });
    assert.equal(o.status, 403);
    const c = await request(app).post('/api/consultations')
      .set('Authorization', `Bearer ${drBa.token}`).send({ patient_id: awa.user.id, motif: 'x' });
    assert.equal(c.status, 403);
  });

  test('un envoi de fichier refusé ne laisse pas de fichier sur le disque', async () => {
    const fs = require('fs');
    const path = require('path');
    const dir = path.join(__dirname, '../uploads/analyses');
    const avant = fs.existsSync(dir) ? fs.readdirSync(dir).length : 0;
    const res = await request(app).post('/api/analyses/upload')
      .set('Authorization', `Bearer ${drBa.token}`)
      .field('patient_id', String(awa.user.id))
      .attach('fichier', Buffer.from('%PDF-test'), 'resultat.pdf');
    assert.equal(res.status, 403);
    assert.equal(fs.readdirSync(dir).length, avant);
  });
});
