// tests/migrations.test.js — construction et évolution du schéma par migrations
const h = require('./helpers');
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const request = require('supertest');

let sequelize, M;
before(async () => {
  await h.reinitialiserBase();
  sequelize = h.charger().models.sequelize;
  M = require('../src/db/migrations');
});
after(h.fermer);

const { verifierSchema } = require('../src/db/verifierSchema');
const viderSchema = () => sequelize.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');

/** Photographie du schéma : colonnes (type, nullabilité, défaut), contraintes, index. */
const photographier = async () => {
  const [colonnes] = await sequelize.query(`
    SELECT table_name, column_name, data_type, udt_name, character_maximum_length AS lg, is_nullable, column_default
    FROM information_schema.columns WHERE table_schema = 'public' AND table_name <> 'schema_migrations'
    ORDER BY table_name, column_name`);
  const [contraintes] = await sequelize.query(`
    SELECT conrelid::regclass::text AS t, conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint WHERE connamespace = 'public'::regnamespace AND conrelid::regclass::text <> 'schema_migrations'
    ORDER BY 1, 2`);
  const [index] = await sequelize.query(`
    SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename <> 'schema_migrations'
    ORDER BY 1`);
  return { colonnes, contraintes, index };
};

let reference;
// Toutes les migrations du dépôt, dans l'ordre d'application
const TOUTES = fs.readdirSync(path.join(__dirname, '../migrations')).filter(f => f.endsWith('.js')).sort();

describe('Base neuve', () => {
  test('les migrations créent tout le schéma, conforme aux modèles', async () => {
    assert.deepEqual(await verifierSchema(), []);
    const { appliquees, enAttente } = await M.etat();
    assert.equal(appliquees[0], '0001-schema-initial.js');
    assert.deepEqual(appliquees, TOUTES);
    assert.deepEqual(enAttente, []);
    reference = await photographier();
    assert.ok(reference.colonnes.length > 100);
  });

  test('relancer les migrations ne fait rien', async () => {
    assert.deepEqual(await M.migrer({ verbeux: false }), []);
  });

  test('deux serveurs qui démarrent en même temps : une seule exécution', async () => {
    await viderSchema();
    const [a, b] = await Promise.all([M.migrer({ verbeux: false }), M.migrer({ verbeux: false })]);
    assert.deepEqual([...a, ...b].sort(), TOUTES);
    assert.deepEqual(await photographier(), reference);
  });

  test('chaque migration s\'annule puis se réapplique ; la migration de référence refuse de s\'annuler', async () => {
    for (const nom of [...TOUTES].reverse().slice(0, -1)) {
      assert.deepEqual(await M.annulerDerniere({ verbeux: false }), [nom]);
    }
    await assert.rejects(M.annulerDerniere({ verbeux: false }), /ne s'annule pas/);
    assert.deepEqual((await M.etat()).appliquees, ['0001-schema-initial.js']);
    assert.deepEqual(await M.migrer({ verbeux: false }), TOUTES.slice(1));
    assert.deepEqual(await photographier(), reference);
  });
});

describe('Base existante créée par l\'ancien sequelize.sync()', () => {
  let ids;

  before(async () => {
    // Reconstitue une base d'une version précédente, remplie de données
    await viderSchema();
    await sequelize.sync();
    await sequelize.query(`
      DROP TABLE schema_migrations, refresh_tokens, journal_acces;
      ALTER TABLE users DROP COLUMN email_verifie, DROP COLUMN token_version;
      DROP INDEX messages_destinataire_id_lu;
      DROP INDEX IF EXISTS push_subscriptions_user_id_endpoint;
      ALTER TABLE donneur_reponses DROP CONSTRAINT donneur_reponses_alerte_id_fkey,
        ADD CONSTRAINT donneur_reponses_alerte_id_fkey FOREIGN KEY (alerte_id) REFERENCES alertes_sang(id) ON UPDATE CASCADE;
      CREATE TYPE enum_users_role AS ENUM ('patient', 'medecin', 'admin', 'donneur', 'admin_hopital');
      ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
      ALTER TABLE users ALTER COLUMN role TYPE enum_users_role USING role::enum_users_role;
    `);
    const bcrypt = require('bcryptjs');
    const mdp = await bcrypt.hash('ancienmdp1', 10);
    const [[patient]] = await sequelize.query(`
      INSERT INTO users (nom, email, password, telephone, role, "createdAt", "updatedAt")
      VALUES ('Ancienne Patiente', 'ancienne@x.sn', '${mdp}', '770000000', 'patient', now(), now()) RETURNING id`);
    const [[medecin]] = await sequelize.query(`
      INSERT INTO users (nom, email, password, telephone, role, "createdAt", "updatedAt")
      VALUES ('Dr Ancien', 'dr.ancien@x.sn', '${mdp}', '770000001', 'medecin', now(), now()) RETURNING id`);
    await sequelize.query(`
      INSERT INTO patients (id, allergies) VALUES (${patient.id}, '["arachide"]');
      INSERT INTO medecins (id, valide) VALUES (${medecin.id}, true);
      INSERT INTO rendez_vous (patient_id, medecin_id, date_rdv, heure, motif, statut, created_at, updated_at)
      VALUES (${patient.id}, ${medecin.id}, '2026-01-15', '10:00', 'Suivi', 'confirme', now(), now());
    `);
    ids = { patient: patient.id, medecin: medecin.id };
  });

  test('la migration complète la base sans perdre de données', async () => {
    assert.deepEqual(await M.migrer({ verbeux: false }), TOUTES);

    const [[u]] = await sequelize.query(`SELECT nom, role, email_verifie, token_version FROM users WHERE id = ${ids.patient}`);
    assert.deepEqual(u, { nom: 'Ancienne Patiente', role: 'patient', email_verifie: true, token_version: 0 });
    const [[p]] = await sequelize.query(`SELECT allergies FROM patients WHERE id = ${ids.patient}`);
    assert.deepEqual(p.allergies, ['arachide']);
    const [[{ n }]] = await sequelize.query('SELECT count(*)::int AS n FROM rendez_vous');
    assert.equal(n, 1);
  });

  test('le schéma obtenu est identique à celui d\'une base neuve', async () => {
    assert.deepEqual(await verifierSchema(), []);
    const obtenu = await photographier();
    assert.deepEqual(obtenu.colonnes, reference.colonnes);
    assert.deepEqual(obtenu.index, reference.index);
    assert.deepEqual(obtenu.contraintes, reference.contraintes);
  });

  test('les anciens comptes fonctionnent après migration', async () => {
    const app = h.charger().app;
    const res = await request(app).post('/api/auth/login').send({ email: 'ancienne@x.sn', password: 'ancienmdp1' });
    assert.equal(res.status, 200);
    const rdv = await request(app).get(`/api/rendezvous/patient/${ids.patient}`).set('Authorization', `Bearer ${res.body.token}`);
    assert.equal(rdv.status, 200);
    assert.equal(rdv.body.length, 1);
  });
});

describe('Nouvelles migrations', () => {
  const fichier = path.join(M_DOSSIER(), '99999999999999-test-ajout-colonne.js');
  function M_DOSSIER() { return require('../src/db/migrations').DOSSIER; }

  after(() => { fs.rmSync(fichier, { force: true }); });

  test('une nouvelle migration s\'applique une fois, puis s\'annule', async () => {
    fs.writeFileSync(fichier, `
      module.exports = {
        async up({ context: { queryInterface, Sequelize } }) {
          await queryInterface.addColumn('hopitaux', 'site_web', { type: Sequelize.STRING(200), allowNull: true });
        },
        async down({ context: { queryInterface } }) {
          await queryInterface.removeColumn('hopitaux', 'site_web');
        },
      };`);
    assert.deepEqual((await M.etat()).enAttente, ['99999999999999-test-ajout-colonne.js']);
    assert.deepEqual(await M.migrer({ verbeux: false }), ['99999999999999-test-ajout-colonne.js']);
    assert.ok('site_web' in await sequelize.getQueryInterface().describeTable('hopitaux'));
    assert.deepEqual(await M.migrer({ verbeux: false }), []);

    assert.deepEqual(await M.annulerDerniere({ verbeux: false }), ['99999999999999-test-ajout-colonne.js']);
    assert.ok(!('site_web' in await sequelize.getQueryInterface().describeTable('hopitaux')));
  });

  test('le contrôle signale un modèle modifié sans migration', async () => {
    const Hopital = h.charger().models.Hopital;
    Hopital.rawAttributes.site_web = { type: { key: 'STRING' }, field: 'site_web', allowNull: true };
    try {
      assert.deepEqual(await verifierSchema(), ['colonne « hopitaux.site_web » absente (modèle Hopital)']);
    } finally {
      delete Hopital.rawAttributes.site_web;
    }
  });

  test('creerMigration produit un fichier horodaté valide', () => {
    const cree = M.creerMigration('Ajouter la ville du patient');
    try {
      assert.match(path.basename(cree), /^\d{14}-ajouter-la-ville-du-patient\.js$/);
      const mod = require(cree);
      assert.equal(typeof mod.up, 'function');
      assert.equal(typeof mod.down, 'function');
    } finally {
      fs.rmSync(cree, { force: true });
    }
  });
});
