// tests/helpers.js
// Utilitaires communs aux tests d'intégration (vraie base PostgreSQL de test).
//
// ⚠️ Ce fichier DOIT être importé en premier dans chaque test : il fixe les
// variables d'environnement avant le chargement de l'application.

// ── Environnement de test ────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.TEST_JWT_SECRET || 'secret-de-test';
process.env.AUTH_RATE_LIMIT = process.env.AUTH_RATE_LIMIT || '1000';
process.env.CLIENT_URL = 'http://localhost:5173';
// Base dédiée : medconnect_test par défaut. Les identifiants (DB_USER, DB_PASSWORD,
// DB_HOST, DB_PORT) viennent de .env sauf si TEST_DB_* sont définis.
process.env.DB_NAME = process.env.TEST_DB_NAME || 'medconnect_test';
for (const k of ['USER', 'PASSWORD', 'HOST', 'PORT']) {
  if (process.env[`TEST_DB_${k}`]) process.env[`DB_${k}`] = process.env[`TEST_DB_${k}`];
}
require('dotenv').config({ path: require('path').join(__dirname, '../.env'), quiet: true });

// Garde-fou : la base est vidée avant les tests, on refuse toute base qui n'est pas « de test ».
if (!/test/i.test(process.env.DB_NAME)) {
  throw new Error(`Refus d'exécuter les tests sur la base "${process.env.DB_NAME}" : son nom doit contenir "test".`);
}

const { Client } = require('pg');

// Crée la base de test si elle n'existe pas encore
const creerBaseSiAbsente = async () => {
  const client = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: 'postgres',
  });
  await client.connect();
  const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [process.env.DB_NAME]);
  if (!rowCount) await client.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
  await client.end();
};

// Chargement de l'application (après la configuration de l'environnement)
let ctx = null;
const charger = () => {
  if (!ctx) {
    const { app, server, io, rateLimit, seedHopitaux } = require('../server');
    const models = require('../src/models');
    const emailService = require('../src/services/emailService');
    ctx = { app, server, io, rateLimit, seedHopitaux, models, outbox: emailService.outbox };
  }
  return ctx;
};

/** Repart d'une base vide : supprime toutes les tables, recrée le schéma, seed des hôpitaux. */
const reinitialiserBase = async () => {
  await creerBaseSiAbsente();
  const { models, seedHopitaux } = charger();
  const { sequelize } = models;
  await sequelize.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  // Même chemin qu'en production : les migrations construisent le schéma
  await require('../src/db/migrations').migrer({ verbeux: false });
  await seedHopitaux();
};

/** Ferme proprement la base et Socket.io en fin de fichier de test. */
const fermer = async () => {
  if (!ctx) return;
  ctx.io.close();
  await ctx.models.sequelize.close();
};

/** Jeton d'accès pour un utilisateur (même format que l'application : id, role, tv). */
const jeton = (user) => require('../src/services/tokenService').signerJetonAcces(user);

let compteur = 0;
/**
 * Crée un utilisateur (et son profil patient / médecin / admin hôpital).
 * Renvoie { user, token }.
 *   creerUtilisateur('patient')
 *   creerUtilisateur('medecin', { hopital: 'CHU de Fann' })
 *   creerUtilisateur('admin_hopital', { hopital: 'CHU de Fann' })
 */
const creerUtilisateur = async (role, opts = {}) => {
  const { User, Patient, Medecin, AdminHopital, Hopital } = charger().models;
  compteur += 1;
  const user = await User.create({
    nom: opts.nom || `${role} ${compteur}`,
    email: opts.email || `${role}${compteur}@test.sn`,
    password: opts.password || 'motdepasse123',
    telephone: '770000000',
    role,
    email_verifie: opts.email_verifie ?? true,
  });
  if (role === 'patient' || role === 'donneur') {
    await Patient.create({ id: user.id, donneurDisponible: role === 'donneur' });
  }
  if (role === 'medecin') {
    await Medecin.create({ id: user.id, valide: opts.valide ?? true, disponible: true, hopital: opts.hopital || null });
  }
  if (role === 'admin_hopital' && opts.hopital) {
    const h = await Hopital.findOne({ where: { nom: opts.hopital } });
    await AdminHopital.create({ user_id: user.id, hopital_id: h.id, hopital_nom: h.nom });
  }
  return { user, token: jeton(user) };
};

/** Crée un rendez-vous entre un patient et un médecin. */
const creerRdv = (patientId, medecinId, statut = 'en_attente') => {
  const { RendezVous } = charger().models;
  return RendezVous.create({
    patient_id: patientId, medecin_id: medecinId,
    date_rdv: new Date().toISOString().split('T')[0], heure: '10:00', statut,
  });
};

/** Dernier email de la boîte d'envoi de test pour un destinataire et un type donnés. */
const dernierEmail = (to, type) =>
  [...charger().outbox].reverse().find(e => e.to.toLowerCase() === to.toLowerCase() && (!type || e.type === type));

module.exports = { charger, reinitialiserBase, fermer, jeton, creerUtilisateur, creerRdv, dernierEmail };
