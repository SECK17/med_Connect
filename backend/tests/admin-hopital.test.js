// tests/admin-hopital.test.js — un admin hôpital n'agit que sur SON hôpital
const h = require('./helpers');
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const PRINCIPAL = 'Hôpital Principal de Dakar';
const FANN = 'CHU de Fann';

let app, adminPrincipal, adminFann, adminSansProfil, superAdmin;
let drFall, drNdiaye, drBa, rdvPrincipal, rdvFann, alertePrincipal, alerteFann;

before(async () => {
  await h.reinitialiserBase();
  app = h.charger().app;
  const { Hopital, AlerteSang } = h.charger().models;

  adminPrincipal  = await h.creerUtilisateur('admin_hopital', { hopital: PRINCIPAL });
  adminFann       = await h.creerUtilisateur('admin_hopital', { hopital: FANN });
  adminSansProfil = await h.creerUtilisateur('admin_hopital');
  superAdmin      = await h.creerUtilisateur('admin');
  drFall   = await h.creerUtilisateur('medecin', { hopital: PRINCIPAL });
  drNdiaye = await h.creerUtilisateur('medecin', { hopital: PRINCIPAL, valide: false });
  drBa     = await h.creerUtilisateur('medecin', { hopital: FANN });
  const awa = await h.creerUtilisateur('patient');

  rdvPrincipal = await h.creerRdv(awa.user.id, drFall.user.id);
  rdvFann      = await h.creerRdv(awa.user.id, drBa.user.id);

  const alerte = async (nom, adminId) => {
    const hop = await Hopital.findOne({ where: { nom } });
    return AlerteSang.create({
      hopital_id: hop.id, hopital_nom: hop.nom, admin_id: adminId,
      groupe_sang: 'O+', groupes_donneurs: ['O+'], urgence: 'Urgent', statut: 'active',
    });
  };
  alertePrincipal = await alerte(PRINCIPAL, adminPrincipal.user.id);
  alerteFann      = await alerte(FANN, adminFann.user.id);
});
after(h.fermer);

const put = (url, qui, body) => request(app).put(url).set('Authorization', `Bearer ${qui.token}`).send(body);

describe('Rendez-vous (PUT /api/rendezvous/:id)', () => {
  test('refusé sur un RDV d\'un autre hôpital', async () => {
    assert.equal((await put(`/api/rendezvous/${rdvFann.id}`, adminPrincipal, { statut: 'confirme' })).status, 403);
  });

  test('autorisé sur un RDV de son hôpital', async () => {
    assert.equal((await put(`/api/rendezvous/${rdvPrincipal.id}`, adminPrincipal, { statut: 'confirme' })).status, 200);
  });

  test('réattribution seulement vers un médecin du même hôpital', async () => {
    assert.equal((await put(`/api/rendezvous/${rdvPrincipal.id}`, adminPrincipal, { medecin_id: drBa.user.id })).status, 403);
    assert.equal((await put(`/api/rendezvous/${rdvPrincipal.id}`, adminPrincipal, { medecin_id: drNdiaye.user.id })).status, 200);
  });

  test('admin hôpital sans profil : refusé', async () => {
    assert.equal((await put(`/api/rendezvous/${rdvPrincipal.id}`, adminSansProfil, { statut: 'annule' })).status, 403);
  });

  test('un médecin ne peut pas réattribuer son RDV', async () => {
    assert.equal((await put(`/api/rendezvous/${rdvFann.id}`, drBa, { medecin_id: drFall.user.id })).status, 403);
    assert.equal((await put(`/api/rendezvous/${rdvFann.id}`, drBa, { statut: 'confirme' })).status, 200);
  });

  test('le super admin garde un accès complet', async () => {
    assert.equal((await put(`/api/rendezvous/${rdvFann.id}`, superAdmin, { statut: 'annule' })).status, 200);
  });
});

describe('Alertes de sang', () => {
  test('refusé sur les alertes d\'un autre hôpital (lire répondants, modifier, supprimer)', async () => {
    const id = alerteFann.id;
    const lire = await request(app).get(`/api/alertes-sang/${id}/reponses`).set('Authorization', `Bearer ${adminPrincipal.token}`);
    assert.equal(lire.status, 403);
    assert.equal((await put(`/api/alertes-sang/${id}`, adminPrincipal, { statut: 'terminee' })).status, 403);
    const del = await request(app).delete(`/api/alertes-sang/${id}`).set('Authorization', `Bearer ${adminPrincipal.token}`);
    assert.equal(del.status, 403);
  });

  test('autorisé sur ses propres alertes', async () => {
    const lire = await request(app).get(`/api/alertes-sang/${alertePrincipal.id}/reponses`).set('Authorization', `Bearer ${adminPrincipal.token}`);
    assert.equal(lire.status, 200);
    assert.equal((await put(`/api/alertes-sang/${alertePrincipal.id}`, adminPrincipal, { statut: 'terminee' })).status, 200);
  });

  test('le super admin peut agir sur toutes les alertes', async () => {
    assert.equal((await put(`/api/alertes-sang/${alerteFann.id}`, superAdmin, { statut: 'terminee' })).status, 200);
  });

  test('alerte inexistante : 404', async () => {
    assert.equal((await put('/api/alertes-sang/999999', adminPrincipal, { statut: 'terminee' })).status, 404);
  });
});

describe('Validation des médecins', () => {
  test('seulement les médecins de son hôpital', async () => {
    assert.equal((await put(`/api/admin-hopital/medecins/${drBa.user.id}/valider`, adminPrincipal)).status, 404);
    assert.equal((await put(`/api/admin-hopital/medecins/${drNdiaye.user.id}/valider`, adminPrincipal)).status, 200);
  });

  test('admin hôpital sans profil : 403 (et non une erreur 500)', async () => {
    assert.equal((await put(`/api/admin-hopital/medecins/${drNdiaye.user.id}/valider`, adminSansProfil)).status, 403);
  });
});
