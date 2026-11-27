// tests/routes-fumee.test.js — chaque route répond correctement au moins une fois.
// Complète les tests ciblés : garantit qu'aucun traitement n'est cassé (erreur 500,
// variable manquante…), en particulier ceux qu'aucun autre test n'appelle.
const h = require('./helpers');
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

let app, M, admin, ah, patient, donneur, drFann, drNouveau, drRefuse, hopitalId, rdvId;

before(async () => {
  await h.reinitialiserBase();
  app = h.charger().app;
  M = h.charger().models;
  hopitalId = (await M.Hopital.findOne({ where: { nom: 'CHU de Fann' } })).id;
  admin     = await h.creerUtilisateur('admin');
  ah        = await h.creerUtilisateur('admin_hopital', { hopital: 'CHU de Fann' });
  patient   = await h.creerUtilisateur('patient', { nom: 'Awa' });
  donneur   = await h.creerUtilisateur('donneur', { nom: 'Moussa' });
  drFann    = await h.creerUtilisateur('medecin', { nom: 'Dr Fann', hopital: 'CHU de Fann' });
  drNouveau = await h.creerUtilisateur('medecin', { nom: 'Dr Nouveau', hopital: 'CHU de Fann', valide: false });
  drRefuse  = await h.creerUtilisateur('medecin', { nom: 'Dr Refusé', hopital: 'CHU de Fann', valide: false });
  rdvId = (await h.creerRdv(patient.user.id, drFann.user.id)).id;
});
after(async () => {
  // Supprime les justificatifs envoyés pendant le test
  const fs = require('fs');
  const path = require('path');
  const demandes = await M.DemandeHopital.findAll({ attributes: ['justificatif'] });
  for (const { justificatif } of demandes) {
    if (justificatif) fs.rmSync(path.join(__dirname, '../uploads/demandes', justificatif), { force: true });
  }
  await h.fermer();
});

const appel = (methode, url, qui, corps) => {
  let r = request(app)[methode](url);
  if (qui) r = r.set('Authorization', `Bearer ${qui.token}`);
  return corps ? r.send(corps) : r;
};
/** Vérifie le code HTTP et renvoie le corps. */
const ok = async (methode, url, qui, corps, attendu = 200) => {
  const res = await appel(methode, url, qui, corps);
  assert.equal(res.status, attendu, `${methode.toUpperCase()} ${url} → ${res.status} ${JSON.stringify(res.body).slice(0, 200)}`);
  return res.body;
};

describe('Hôpitaux', () => {
  test('lecture publique et statistiques', async () => {
    assert.ok((await ok('get', '/api/hopitaux')).length >= 10);
    await ok('get', `/api/hopitaux/${hopitalId}`);
    await ok('get', '/api/hopitaux/rdv-stats-all', admin);
    await ok('get', `/api/hopitaux/${hopitalId}/medecins`, admin);
    await ok('get', `/api/hopitaux/${hopitalId}/patients`, admin);
    await ok('get', `/api/hopitaux/${hopitalId}/rdv-stats`, admin);
  });

  test('création, modification, suppression (admin)', async () => {
    const cree = await ok('post', '/api/hopitaux', admin, { nom: 'Clinique Test', type: 'Clinique', ville: 'Thiès' }, 201);
    const id = cree.id ?? cree.hopital?.id;
    assert.ok(id, JSON.stringify(cree));
    await ok('put', `/api/hopitaux/${id}`, admin, { nom: 'Clinique Test 2', ville: 'Thiès' });
    await ok('delete', `/api/hopitaux/${id}`, admin);
  });
});

describe('Administration d\'hôpital', () => {
  test('l\'admin principal crée, liste et supprime un admin d\'hôpital', async () => {
    const cree = await ok('post', '/api/admin-hopital', admin,
      { nom: 'Admin Pikine', email: 'admin.pikine@x.sn', password: 'motdepasse1', hopital_id: hopitalId }, 201);
    const liste = await ok('get', '/api/admin-hopital', admin);
    assert.ok(liste.length >= 2);
    const id = (liste.find(a => (a.user?.email || a.email) === 'admin.pikine@x.sn') || {}).id ?? cree.id;
    await ok('delete', `/api/admin-hopital/${id}`, admin);
  });

  test('l\'admin d\'hôpital gère son établissement', async () => {
    await ok('get', '/api/admin-hopital/me', ah);
    await ok('get', '/api/admin-hopital/donneurs', ah);
    const medecins = await ok('get', '/api/admin-hopital/medecins', ah);
    assert.ok(medecins.length >= 3);
    await ok('put', `/api/admin-hopital/medecins/${drNouveau.user.id}/valider`, ah);
    await ok('put', `/api/admin-hopital/medecins/${drRefuse.user.id}/rejeter`, ah);
    await ok('get', '/api/admin-hopital/patients', ah);
    const rdvs = await ok('get', '/api/admin-hopital/rendez-vous', ah);
    assert.ok(rdvs.some(r => r.id === rdvId));
    await ok('put', `/api/admin-hopital/rendez-vous/${rdvId}/transferer`, ah, { medecin_id: drFann.user.id });
    const autre = await h.creerRdv(patient.user.id, drFann.user.id);
    await ok('put', `/api/admin-hopital/rendez-vous/${autre.id}`, ah, { statut: 'annule' });
  });
});

describe('Demandes de changement d\'hôpital', () => {
  const demander = (dr) => request(app).post('/api/demandes-hopital')
    .set('Authorization', `Bearer ${dr.token}`)
    .field('hopital_actuel', 'CHU de Fann').field('hopital_demande', 'Hôpital de Pikine')
    .attach('justificatif', Buffer.from('%PDF-test'), 'attestation.pdf');

  test('le médecin demande, consulte puis annule sa demande', async () => {
    assert.equal((await demander(drFann)).status, 201);
    await ok('get', '/api/demandes-hopital/moi', drFann);
    await ok('delete', '/api/demandes-hopital/moi', drFann);
  });

  test('l\'admin valide une demande et rejette une autre', async () => {
    const a = await demander(drFann);
    assert.equal(a.status, 201, JSON.stringify(a.body));
    const b = await demander(drNouveau);
    assert.equal(b.status, 201, JSON.stringify(b.body));
    const liste = await ok('get', '/api/demandes-hopital', admin);
    const idDe = (dr) => liste.find(d => d.medecin_id === dr.user.id && d.statut === 'en_attente').id;
    await ok('put', `/api/demandes-hopital/${idDe(drFann)}/valider`, admin);
    await ok('put', `/api/demandes-hopital/${idDe(drNouveau)}/rejeter`, admin, { motif: 'Justificatif illisible' });
    assert.equal((await M.Medecin.findByPk(drFann.user.id)).hopital, 'Hôpital de Pikine');
  });

  test('un justificatif dans un format non autorisé est refusé', async () => {
    const res = await request(app).post('/api/demandes-hopital')
      .set('Authorization', `Bearer ${drRefuse.token}`)
      .field('hopital_demande', 'Hôpital de Pikine')
      .attach('justificatif', Buffer.from('<script>alert(1)</script>'), 'page.html');
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Format non supporté/);
  });
});

describe('Don de sang', () => {
  let alerteId;

  test('espace donneur', async () => {
    await ok('put', '/api/donneur/inscription', donneur, { groupe: 'O+', ville: 'Dakar' });
    await ok('put', '/api/donneur/localisation', donneur, { latitude: 14.69, longitude: -17.44 });
    await ok('put', '/api/donneur/disponibilite', donneur, { disponible: true });
    await ok('get', '/api/donneur/dashboard', donneur);
    await ok('get', '/api/donneur/profil', donneur);
  });

  test('alerte : création, diffusion, réponse, suivi, clôture, suppression', async () => {
    const cree = await ok('post', '/api/alertes-sang', ah, {
      groupe_sang: 'O+', quantite: '2', message: 'Besoin urgent', urgence: 'Urgent',
      latitude: 14.69, longitude: -17.44, rayon_km: 20, duree_heures: 24,
    }, 201);
    alerteId = cree.id ?? cree.alerte?.id;
    assert.ok(alerteId, JSON.stringify(cree));
    await ok('get', '/api/alertes-sang/moi', ah);
    await ok('get', '/api/alertes-sang/toutes', admin);
    await ok('get', '/api/alertes-sang/patient', patient);
    const pourDonneur = await ok('get', '/api/alertes-sang/donneur', donneur);
    assert.ok(pourDonneur.some(a => a.id === alerteId), 'le donneur proche reçoit l\'alerte');
    await ok('post', `/api/alertes-sang/${alerteId}/repondre`, donneur, {});
    await ok('get', '/api/alertes-sang/mes-reponses', donneur);
    const reponses = await ok('get', `/api/alertes-sang/${alerteId}/reponses`, ah);
    assert.equal(reponses.length ?? reponses.reponses?.length, 1);
    await ok('put', `/api/alertes-sang/${alerteId}`, ah, { statut: 'terminee' });
    await ok('delete', `/api/alertes-sang/${alerteId}`, ah); // avec une réponse : supprimée aussi
    assert.equal(await M.DonneurReponse.count({ where: { alerte_id: alerteId } }), 0);
  });

  test('un donneur qui a répondu à une alerte peut être supprimé', async () => {
    const cree = await ok('post', '/api/alertes-sang', ah, { groupe_sang: 'O+', latitude: 14.69, longitude: -17.44, rayon_km: 20 }, 201);
    const id = cree.id ?? cree.alerte?.id;
    const d = await h.creerUtilisateur('donneur');
    await ok('post', `/api/alertes-sang/${id}/repondre`, d, {});
    await ok('delete', `/api/users/${d.user.id}`, admin);
  });
});

describe('Médecins, avis, comptes', () => {
  test('annuaire et profil', async () => {
    await ok('get', '/api/medecins');
    await ok('get', `/api/medecins/${drFann.user.id}`);
    await ok('put', `/api/medecins/${drFann.user.id}/validate`, admin);
  });

  test('avis', async () => {
    await ok('get', `/api/evaluations/medecin/${drFann.user.id}`);
    await ok('get', '/api/evaluations/patient/moi', patient);
  });

  test('gestion des comptes par l\'admin', async () => {
    await ok('get', '/api/users', admin);
    const a = await h.creerUtilisateur('medecin', { valide: false });
    const b = await h.creerUtilisateur('medecin', { valide: false });
    await ok('put', `/api/users/${a.user.id}/validate`, admin);
    await ok('put', `/api/users/${b.user.id}/reject`, admin);
    const c = await h.creerUtilisateur('patient');
    await ok('delete', `/api/users/${c.user.id}`, admin);
  });
});

describe('Rendez-vous, messages, notifications', () => {
  test('statistiques et suppression d\'un rendez-vous', async () => {
    await ok('get', '/api/rendezvous/stats', admin);
    await ok('get', `/api/rendezvous/medecin/${drFann.user.id}`, drFann);
    const r = await h.creerRdv(patient.user.id, drFann.user.id);
    await ok('delete', `/api/rendezvous/${r.id}`, patient);
  });

  test('messages non lus', async () => {
    await ok('get', '/api/messages/unread/count', patient);
  });

  test('abonnement aux notifications push', async () => {
    await ok('get', '/api/push/vapid-public-key');
    const abonnement = { endpoint: 'https://push.exemple.sn/abc', keys: { p256dh: 'cle', auth: 'secret' } };
    await ok('post', '/api/push/subscribe', patient, abonnement);
    // Le navigateur se réabonne régulièrement : pas de doublon, les clés sont mises à jour
    await ok('post', '/api/push/subscribe', patient, { ...abonnement, keys: { p256dh: 'cle2', auth: 'secret2' } });
    const lignes = await M.PushSubscription.findAll({ where: { user_id: patient.user.id } });
    assert.equal(lignes.length, 1);
    assert.equal(lignes[0].p256dh, 'cle2');
    await ok('delete', '/api/push/unsubscribe', patient);
    assert.equal(await M.PushSubscription.count({ where: { user_id: patient.user.id } }), 0);
  });

  test('ordonnance envoyée en photo', async () => {
    const res = await request(app).post('/api/ordonnances/upload')
      .set('Authorization', `Bearer ${drFann.token}`)
      .field('patient_id', String(patient.user.id))
      .attach('fichier', Buffer.from('%PDF-test'), 'ordonnance.pdf');
    assert.equal(res.status, 201, JSON.stringify(res.body));
    require('fs').unlink(require('path').join(__dirname, '..', res.body.fichier), () => {});
  });
});
