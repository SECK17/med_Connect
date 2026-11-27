// tests/validation.test.js — validation des données reçues et règles métier associées
const h = require('./helpers');
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

let app, awa, moussa, admin, drFall, drNonValide, adminFann;
const FANN = 'CHU de Fann';
const demain = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const hier = new Date(Date.now() - 86400000).toISOString().split('T')[0];

before(async () => {
  await h.reinitialiserBase();
  app = h.charger().app;
  awa         = await h.creerUtilisateur('patient', { nom: 'Awa' });
  moussa      = await h.creerUtilisateur('patient', { nom: 'Moussa' });
  admin       = await h.creerUtilisateur('admin');
  drFall      = await h.creerUtilisateur('medecin', { nom: 'Dr Fall', hopital: FANN });
  drNonValide = await h.creerUtilisateur('medecin', { valide: false });
  adminFann   = await h.creerUtilisateur('admin_hopital', { hopital: FANN });
});
after(h.fermer);

const envoyer = (methode, url, qui, body) => {
  const r = request(app)[methode](url);
  if (qui) r.set('Authorization', `Bearer ${qui.token}`);
  return r.send(body);
};

describe('Format des réponses d\'erreur', () => {
  test('400 avec un message lisible et la liste des champs en erreur', async () => {
    const res = await envoyer('post', '/api/auth/register', null, {
      nom: '', email: 'pas-un-email', password: 'abc', telephone: 'abc', role: 'patient',
    });
    assert.equal(res.status, 400);
    assert.equal(typeof res.body.message, 'string');
    const champs = res.body.erreurs.map(e => e.champ);
    for (const c of ['nom', 'email', 'password', 'telephone']) assert.ok(champs.includes(c), c);
  });

  test('les champs inconnus sont ignorés (pas d\'injection de champs)', async () => {
    const res = await envoyer('post', '/api/auth/register', null, {
      nom: 'Test', email: 'champs@x.sn', password: 'motdepasse1', telephone: '770000000',
      role: 'patient', email_verifie: true, token_version: 99,
    });
    assert.equal(res.status, 201);
    const u = await h.charger().models.User.findOne({ where: { email: 'champs@x.sn' } });
    assert.equal(u.email_verifie, false, 'email_verifie envoyé par le client ignoré');
    assert.equal(u.token_version, 0);
  });
});

describe('Emails', () => {
  test('enregistré en minuscules, connexion insensible à la casse', async () => {
    const r = await envoyer('post', '/api/auth/register', null, {
      nom: 'Casse', email: '  Mixte@Example.SN ', password: 'motdepasse1', telephone: '770000000', role: 'patient',
    });
    assert.equal(r.status, 201);
    const { User } = h.charger().models;
    const u = await User.findOne({ where: { email: 'mixte@example.sn' } });
    assert.ok(u);
    await u.update({ email_verifie: true });
    assert.equal((await envoyer('post', '/api/auth/login', null, { email: 'MIXTE@example.sn', password: 'motdepasse1' })).status, 200);
  });

  test('un compte ancien enregistré avec des majuscules peut toujours se connecter', async () => {
    await h.creerUtilisateur('patient', { email: 'Ancien@Test.SN', password: 'motdepasse1' });
    assert.equal((await envoyer('post', '/api/auth/login', null, { email: 'ancien@test.sn', password: 'motdepasse1' })).status, 200);
  });

  test('doublon détecté même avec une casse différente', async () => {
    const res = await envoyer('post', '/api/auth/register', null, {
      nom: 'Doublon', email: 'MIXTE@EXAMPLE.SN', password: 'motdepasse1', telephone: '770000000', role: 'patient',
    });
    assert.equal(res.status, 400);
  });
});

describe('Paramètres d\'URL', () => {
  test('identifiant non numérique : 400 (et non une erreur SQL 500)', async () => {
    for (const url of ['/api/medecins/abc', '/api/hopitaux/1;DROP', `/api/rendezvous/patient/abc`, '/api/messages/xyz']) {
      const res = await request(app).get(url).set('Authorization', `Bearer ${admin.token}`);
      assert.equal(res.status, 400, url);
    }
  });
});

describe('Rendez-vous', () => {
  const rdv = (body) => envoyer('post', '/api/rendezvous', awa, { medecinId: drFall.user.id, date: demain, heure: '10:00', motif: 'Consultation', ...body });

  test('un patient ne peut pas prendre rendez-vous au nom d\'un autre patient', async () => {
    const res = await rdv({ patientId: moussa.user.id });
    assert.equal(res.status, 403);
  });

  test('le patient est toujours l\'utilisateur connecté', async () => {
    const res = await rdv({});
    assert.equal(res.status, 201);
    assert.equal(res.body.patient_id, awa.user.id);
  });

  test('date, heure et motif sont vérifiés', async () => {
    assert.equal((await rdv({ date: '2026-02-30' })).status, 400, 'date inexistante');
    assert.equal((await rdv({ heure: '25:00' })).status, 400, 'heure invalide');
    assert.equal((await rdv({ motif: '' })).status, 400, 'motif vide');
    assert.equal((await rdv({ motif: 'x'.repeat(501) })).status, 400, 'motif trop long');
    assert.equal((await rdv({ date: hier })).status, 400, 'date passée');
  });

  test('médecin inexistant ou non validé : refusé', async () => {
    assert.equal((await rdv({ medecinId: 999999 })).status, 404);
    assert.equal((await rdv({ medecinId: drNonValide.user.id })).status, 404);
  });

  test('statut de rendez-vous inconnu : refusé', async () => {
    const r = await rdv({});
    const res = await envoyer('put', `/api/rendezvous/${r.body.id}`, drFall, { statut: 'pirate' });
    assert.equal(res.status, 400);
  });
});

describe('Profil médecin', () => {
  test('un médecin ne peut pas changer d\'hôpital lui-même', async () => {
    const res = await envoyer('put', `/api/medecins/${drFall.user.id}`, drFall, { hopital: 'Clinique Pasteur' });
    assert.equal(res.status, 403);
    const m = await h.charger().models.Medecin.findByPk(drFall.user.id);
    assert.equal(m.hopital, FANN);
  });

  test('renvoyer son hôpital actuel (formulaire de profil) reste permis', async () => {
    const res = await envoyer('put', `/api/medecins/${drFall.user.id}`, drFall, { hopital: FANN, specialite: 'Cardiologie' });
    assert.equal(res.status, 200);
  });

  test('disponibilités : jours et heures vérifiés', async () => {
    const ok = await envoyer('put', `/api/medecins/${drFall.user.id}`, drFall, {
      disponibilites: { lundi: { actif: true, debut: '08:00', fin: '17:00' } },
    });
    assert.equal(ok.status, 200);
    const ko = await envoyer('put', `/api/medecins/${drFall.user.id}`, drFall, {
      disponibilites: { lundi: { actif: 'oui', debut: '8h', fin: '17:00' } },
    });
    assert.equal(ko.status, 400);
  });
});

describe('Évaluations', () => {
  test('impossible de noter un médecin sans rendez-vous passé confirmé', async () => {
    const res = await envoyer('post', '/api/evaluations', moussa, { medecin_id: drFall.user.id, note: 1 });
    assert.equal(res.status, 403);
  });

  test('note hors de 1 à 5 : refusée', async () => {
    assert.equal((await envoyer('post', '/api/evaluations', awa, { medecin_id: drFall.user.id, note: 9 })).status, 400);
  });

  test('après un rendez-vous confirmé et passé : autorisé', async () => {
    const { RendezVous } = h.charger().models;
    await RendezVous.create({ patient_id: awa.user.id, medecin_id: drFall.user.id, date_rdv: hier, heure: '09:00', statut: 'confirme' });
    assert.equal((await envoyer('post', '/api/evaluations', awa, { medecin_id: drFall.user.id, note: 5 })).status, 200);
  });

  test('un médecin ne peut pas noter', async () => {
    assert.equal((await envoyer('post', '/api/evaluations', drFall, { medecin_id: drFall.user.id, note: 5 })).status, 403);
  });
});

describe('Dossier patient', () => {
  test('les listes médicales doivent être des listes de textes', async () => {
    assert.equal((await envoyer('put', `/api/patients/${awa.user.id}`, awa, { allergies: 'pas une liste' })).status, 400);
    assert.equal((await envoyer('put', `/api/patients/${awa.user.id}`, awa, { groupeSanguin: 'Z+' })).status, 400);
    assert.equal((await envoyer('put', `/api/patients/${awa.user.id}`, awa, { allergies: ['Pénicilline'], groupeSanguin: 'O+' })).status, 200);
  });

  test('le formulaire de profil tel qu\'envoyé par le frontend (champs vides) est accepté', async () => {
    const res = await envoyer('put', `/api/patients/${awa.user.id}`, awa, {
      adresse: '', dateNaissance: '', groupeSanguin: '', telephone: '',
      allergies: [], antecedents: [], traitements: [], vaccinations: [],
    });
    assert.equal(res.status, 200);
  });

  test('ordonnance : au moins un médicament avec un nom', async () => {
    await h.creerRdv(awa.user.id, drFall.user.id);
    const vide = await envoyer('post', '/api/ordonnances', drFall, { patient_id: awa.user.id, medicaments: [] });
    assert.equal(vide.status, 400);
    const sansNom = await envoyer('post', '/api/ordonnances', drFall, { patient_id: awa.user.id, medicaments: [{ nom: '' }] });
    assert.equal(sansNom.status, 400);
    const ok = await envoyer('post', '/api/ordonnances', drFall, { patient_id: awa.user.id, medicaments: [{ nom: 'Paracétamol', dosage: '500 mg' }] });
    assert.equal(ok.status, 201);
  });
});

describe('Alertes de sang', () => {
  test('groupe sanguin et urgence vérifiés', async () => {
    assert.equal((await envoyer('post', '/api/alertes-sang', adminFann, { groupe_sang: 'Z', urgence: 'Urgent' })).status, 400);
    assert.equal((await envoyer('post', '/api/alertes-sang', adminFann, { groupe_sang: 'O+', urgence: 'Panique' })).status, 400);
  });

  test('répondre à une alerte inexistante : 404 (et non une erreur 500)', async () => {
    const res = await envoyer('post', '/api/alertes-sang/999999/repondre', awa, {});
    assert.equal(res.status, 404);
  });
});

// Ces tests rejouent EXACTEMENT les données envoyées par les formulaires du frontend
// (identifiants en texte, champs vides, champs en trop) : la validation ne doit rien casser.
describe('Compatibilité avec les formulaires du frontend', () => {
  test('inscription (Register.jsx)', async () => {
    const res = await envoyer('post', '/api/auth/register', null, {
      role: 'medecin', nom: 'Dr Diallo', email: 'diallo@x.sn', password: 'motdepasse1', telephone: '77 123 45 67',
      dateNaissance: '', adresse: '', groupeSanguin: '', specialite: 'Pédiatrie', numeroOrdre: 'SN-123',
      hopital: FANN, experience: '',
    });
    assert.equal(res.status, 201, res.body.message);
  });

  test('prise de rendez-vous (patient/RendezVous.jsx : identifiants en texte)', async () => {
    const res = await envoyer('post', '/api/rendezvous', awa, {
      patientId: String(awa.user.id), medecinId: String(drFall.user.id), date: demain, heure: '08:30', motif: 'Fièvre',
    });
    assert.equal(res.status, 201, res.body.message);
  });

  test('confirmation par le médecin (DemandesRDV.jsx)', async () => {
    const r = await envoyer('post', '/api/rendezvous', awa, { medecinId: drFall.user.id, date: demain, heure: '09:00', motif: 'Suivi' });
    const res = await envoyer('put', `/api/rendezvous/${r.body.id}`, drFall, { date_rdv: demain, heure: '11:30', statut: 'confirme' });
    assert.equal(res.status, 200, res.body.message);
  });

  test('profil médecin (medecin/Profil.jsx : brouillon complet)', async () => {
    const res = await envoyer('put', `/api/medecins/${drFall.user.id}`, drFall, {
      nom: 'Dr Fall', email: 'ignore@x.sn', telephone: '', specialite: 'Cardiologie',
      numeroOrdre: '', hopital: FANN, experience: '2012',
    });
    assert.equal(res.status, 200, res.body.message);
  });

  test('compte-rendu de consultation (Consultations.jsx / DossierPatient.jsx)', async () => {
    const res = await envoyer('post', '/api/consultations', drFall, {
      patient_id: String(awa.user.id), date: new Date().toISOString().split('T')[0], hopital: '',
      motif: 'Douleurs', diagnostic: '', traitement: '', notes: '',
    });
    assert.equal(res.status, 201, res.body.message);
  });

  test('création d\'alerte (adminHopital/Alertes.jsx : valeurs par défaut du formulaire)', async () => {
    const res = await envoyer('post', '/api/alertes-sang', adminFann, {
      groupe_sang: 'O+', quantite: '', message: '', urgence: 'Urgent',
      rayon_km: null, duree_heures: 72, latitude: null, longitude: null,
    });
    assert.equal(res.status, 201, res.body.message);
  });

  test('création d\'un admin hôpital (AdminDashboard.jsx : téléphone vide)', async () => {
    const { Hopital } = h.charger().models;
    const hop = await Hopital.findOne({ where: { nom: 'Clinique Pasteur' } });
    const res = await envoyer('post', '/api/admin-hopital', admin, {
      nom: 'Secrétaire', email: 'secretaire@x.sn', password: 'motdepasse1', telephone: '', hopital_id: hop.id,
    });
    assert.equal(res.status, 201, res.body.message);
  });
});
