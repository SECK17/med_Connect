// tests/journal.test.js — journal d'accès aux dossiers médicaux
const h = require('./helpers');
const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

let app, JournalAcces, awa, admin, drFall, drBa, moussa;

before(async () => {
  await h.reinitialiserBase();
  app = h.charger().app;
  JournalAcces = h.charger().models.JournalAcces;
  awa    = await h.creerUtilisateur('patient', { nom: 'Awa' });
  moussa = await h.creerUtilisateur('donneur', { nom: 'Moussa' });
  admin  = await h.creerUtilisateur('admin', { nom: 'Admin' });
  drFall = await h.creerUtilisateur('medecin', { nom: 'Dr Fall' }); // suit Awa (RDV)
  drBa   = await h.creerUtilisateur('medecin', { nom: 'Dr Ba' });   // aucun lien
  await h.creerRdv(awa.user.id, drFall.user.id);
});
after(h.fermer);

// L'écriture du journal se fait après l'envoi de la réponse : on attend qu'elle arrive.
const attendre = async (where, n = 1) => {
  for (let i = 0; i < 50; i++) {
    const lignes = await JournalAcces.findAll({ where, order: [['id', 'ASC']] });
    if (lignes.length >= n) return lignes;
    await new Promise(r => setTimeout(r, 20));
  }
  return JournalAcces.findAll({ where });
};
const pause = () => new Promise(r => setTimeout(r, 150));

const auth = (qui) => ({ Authorization: `Bearer ${qui.token}` });

beforeEach(async () => {
  await JournalAcces.sequelize.query('TRUNCATE journal_acces');
});

describe('Enregistrement des accès', () => {
  test('la lecture d\'un dossier par un médecin est tracée', async () => {
    const res = await request(app).get(`/api/ordonnances/patient/${awa.user.id}`).set(auth(drFall))
      .set('User-Agent', 'NavigateurTest/1.0');
    assert.equal(res.status, 200);
    const [l] = await attendre({ acteur_id: drFall.user.id });
    assert.equal(l.patient_id, awa.user.id);
    assert.equal(l.acteur_nom, 'Dr Fall');
    assert.equal(l.acteur_role, 'medecin');
    assert.equal(l.action, 'lecture');
    assert.equal(l.ressource, 'ordonnances');
    assert.equal(l.autorise, true);
    assert.equal(l.statut_http, 200);
    assert.equal(l.user_agent, 'NavigateurTest/1.0');
  });

  test('chaque partie du dossier est tracée', async () => {
    const routes = {
      profil: `/api/patients/${awa.user.id}`,
      rendezvous: `/api/rendezvous/patient/${awa.user.id}`,
      ordonnances: `/api/ordonnances/patient/${awa.user.id}`,
      analyses: `/api/analyses/patient/${awa.user.id}`,
      consultations: `/api/consultations/patient/${awa.user.id}`,
      partages: `/api/partages/patient/${awa.user.id}`,
    };
    for (const url of Object.values(routes)) {
      assert.equal((await request(app).get(url).set(auth(admin))).status, 200, url);
    }
    const lignes = await attendre({ acteur_id: admin.user.id }, 6);
    assert.deepEqual(lignes.map(l => l.ressource).sort(), Object.keys(routes).sort());
    assert.ok(lignes.every(l => l.patient_id === awa.user.id));
  });

  test('une tentative refusée est tracée comme refusée', async () => {
    const res = await request(app).get(`/api/analyses/patient/${awa.user.id}`).set(auth(drBa));
    assert.equal(res.status, 403);
    const [l] = await attendre({ acteur_id: drBa.user.id });
    assert.equal(l.autorise, false);
    assert.equal(l.statut_http, 403);
    assert.equal(l.patient_id, awa.user.id);
  });

  test('une création refusée (médecin sans lien) est tracée', async () => {
    const res = await request(app).post('/api/ordonnances').set(auth(drBa))
      .send({ patient_id: awa.user.id, medicaments: [{ nom: 'X' }] });
    assert.equal(res.status, 403);
    const [l] = await attendre({ acteur_id: drBa.user.id });
    assert.equal(l.action, 'creation');
    assert.equal(l.autorise, false);
  });

  test('une création réussie garde l\'identifiant du document', async () => {
    const res = await request(app).post('/api/consultations').set(auth(drFall))
      .send({ patient_id: awa.user.id, motif: 'Contrôle' });
    assert.equal(res.status, 201);
    const [l] = await attendre({ acteur_id: drFall.user.id });
    assert.equal(l.action, 'creation');
    assert.equal(l.ressource, 'consultations');
    assert.equal(l.ressource_id, res.body.id);
    assert.equal(l.patient_id, awa.user.id);
  });

  test('la suppression d\'une consultation est tracée avec le bon patient', async () => {
    const c = await request(app).post('/api/consultations').set(auth(drFall))
      .send({ patient_id: awa.user.id, motif: 'À supprimer' });
    const d = await request(app).delete(`/api/consultations/${c.body.id}`).set(auth(drFall));
    assert.equal(d.status, 200);
    const lignes = await attendre({ acteur_id: drFall.user.id, action: 'suppression' });
    assert.equal(lignes[0].patient_id, awa.user.id);
    assert.equal(lignes[0].ressource_id, c.body.id);
  });

  test('le partage et le retrait de partage par le patient sont tracés', async () => {
    const p = await request(app).post('/api/partages').set(auth(awa)).send({ medecin_id: drBa.user.id });
    assert.equal(p.status, 201);
    const r = await request(app).delete(`/api/partages/${p.body.partage.id}`).set(auth(awa));
    assert.equal(r.status, 200);
    const lignes = await attendre({ acteur_id: awa.user.id }, 2);
    assert.deepEqual(lignes.map(l => l.action), ['creation', 'suppression']);
    assert.equal(lignes[0].details, 'Dr Ba');
    assert.equal(lignes[1].details, 'Dr Ba');
  });

  test('la modification du profil est tracée', async () => {
    const res = await request(app).put(`/api/patients/${awa.user.id}`).set(auth(admin)).send({ allergies: ['latex'] });
    assert.equal(res.status, 200);
    const [l] = await attendre({ acteur_id: admin.user.id });
    assert.equal(l.action, 'modification');
    assert.equal(l.ressource, 'profil');
  });

  test('le téléchargement d\'un fichier médical est tracé', async () => {
    const up = await request(app).post('/api/analyses/upload').set(auth(drFall))
      .field('patient_id', String(awa.user.id))
      .attach('fichier', Buffer.from('%PDF-test'), 'resultat.pdf');
    assert.equal(up.status, 201);
    const url = '/' + up.body.fichier;

    assert.equal((await request(app).get(`${url}?token=${admin.token}`)).status, 200);
    assert.equal((await request(app).get(url).set(auth(drBa))).status, 403);

    const ok = await attendre({ acteur_id: admin.user.id });
    assert.equal(ok[0].action, 'telechargement');
    assert.equal(ok[0].ressource, 'fichier');
    assert.equal(ok[0].patient_id, awa.user.id);
    assert.equal(ok[0].ressource_id, up.body.id);
    assert.ok(!ok[0].chemin.includes('token'), 'le jeton ne doit pas finir dans le journal');
    const refus = await attendre({ acteur_id: drBa.user.id });
    assert.equal(refus[0].autorise, false);
    require('fs').unlink(require('path').join(__dirname, '..', up.body.fichier), () => {});
  });

  test('un patient qui consulte son propre dossier ne remplit pas le journal', async () => {
    await request(app).get(`/api/ordonnances/patient/${awa.user.id}`).set(auth(awa));
    await request(app).get(`/api/patients/${awa.user.id}`).set(auth(awa));
    await pause();
    assert.equal(await JournalAcces.count(), 0);
  });

  test('les requêtes invalides ou sans jeton ne sont pas tracées', async () => {
    await request(app).get(`/api/ordonnances/patient/${awa.user.id}`);           // 401
    await request(app).post('/api/ordonnances').set(auth(drFall)).send({});      // 400
    await pause();
    assert.equal(await JournalAcces.count(), 0);
  });
});

describe('Consultation du journal', () => {
  beforeEach(async () => {
    await request(app).get(`/api/ordonnances/patient/${awa.user.id}`).set(auth(drFall));
    await request(app).get(`/api/analyses/patient/${awa.user.id}`).set(auth(drBa)); // refusé
    await attendre({}, 2);
  });

  test('le patient voit qui a accédé à son dossier, sans IP ni navigateur', async () => {
    const res = await request(app).get(`/api/journal/patient/${awa.user.id}`).set(auth(awa));
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 2);
    assert.deepEqual(res.body.map(l => l.acteur_nom).sort(), ['Dr Ba', 'Dr Fall']);
    assert.equal(res.body[0].ip, undefined);
    assert.equal(res.body[0].user_agent, undefined);
    assert.equal(res.headers['x-total-count'], '2');
  });

  test('personne d\'autre que le patient et l\'admin ne voit ce journal', async () => {
    for (const qui of [drFall, drBa, moussa]) {
      const res = await request(app).get(`/api/journal/patient/${awa.user.id}`).set(auth(qui));
      assert.equal(res.status, 403, qui.user.nom);
    }
    const admin200 = await request(app).get(`/api/journal/patient/${awa.user.id}`).set(auth(admin));
    assert.equal(admin200.status, 200);
    assert.ok('ip' in admin200.body[0]);
  });

  test('l\'admin filtre le journal global (ex. accès refusés)', async () => {
    const res = await request(app).get('/api/journal?autorise=false').set(auth(admin));
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].acteur_id, drBa.user.id);

    const parActeur = await request(app).get(`/api/journal?acteur_id=${drFall.user.id}&ressource=ordonnances`).set(auth(admin));
    assert.equal(parActeur.body.length, 1);

    const aujourdhui = new Date().toISOString().split('T')[0];
    const parDate = await request(app).get(`/api/journal?du=${aujourdhui}&au=${aujourdhui}`).set(auth(admin));
    assert.equal(parDate.body.length, 2);

    assert.equal((await request(app).get('/api/journal?action=pirater').set(auth(admin))).status, 400);
    assert.equal((await request(app).get('/api/journal').set(auth(drFall))).status, 403);
  });

  test('pagination du journal', async () => {
    const res = await request(app).get(`/api/journal?page=2&limit=1`).set(auth(admin));
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 1);
    assert.equal(res.headers['x-total-pages'], '2');
  });
});

describe('Intégrité', () => {
  test('le journal ne peut pas être modifié ni supprimé via l\'application', async () => {
    const l = await JournalAcces.create({
      acteur_id: drBa.user.id, acteur_role: 'medecin', patient_id: awa.user.id, action: 'lecture',
      ressource: 'profil', autorise: false, statut_http: 403, methode: 'GET', chemin: '/x',
    });
    await assert.rejects(l.update({ autorise: true }), /ne peut pas être modifié/);
    await assert.rejects(l.destroy(), /ne peut pas être supprimé/);
    await assert.rejects(JournalAcces.update({ autorise: true }, { where: {} }), /ne peut pas être modifié/);
  });

  test('purge : rien n\'est supprimé sans durée de conservation configurée', async () => {
    const { purgerJournal } = require('../src/middleware/journal');
    await JournalAcces.create({
      acteur_id: 1, acteur_role: 'medecin', action: 'lecture', ressource: 'profil',
      autorise: true, statut_http: 200, methode: 'GET', chemin: '/x',
    });
    await JournalAcces.sequelize.query("UPDATE journal_acces SET created_at = now() - interval '400 days'");
    delete process.env.JOURNAL_RETENTION_JOURS;
    assert.equal(await purgerJournal(), 0);
    process.env.JOURNAL_RETENTION_JOURS = '365';
    assert.equal(await purgerJournal(), 1);
    delete process.env.JOURNAL_RETENTION_JOURS;
    assert.equal(await JournalAcces.count(), 0);
  });
});
