// db/migrations.js — évolution du schéma de la base par migrations versionnées (Umzug).
//
// Les fichiers sont dans backend/migrations/, appliqués dans l'ordre alphabétique de leur nom,
// une seule fois chacun : la table « schema_migrations » garde la liste de ceux déjà appliqués.
// Remplace l'ancien sequelize.sync({ alter: true }), qui pouvait modifier ou perdre des
// données à chaque démarrage.
const fs = require('fs');
const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');
const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/db');

const DOSSIER = path.join(__dirname, '../../migrations');
// Clé du verrou PostgreSQL : deux serveurs qui démarrent en même temps ne migrent pas en parallèle
const CLE_VERROU = 7_302_026;

const silencieux = { info() {}, warn() {}, error() {}, debug() {} };
const bavard = {
  info: (e) => {
    if (e.event === 'migrating') console.log(`  → ${e.name}…`);
    if (e.event === 'migrated') console.log(`  ✓ ${e.name} (${e.durationSeconds}s)`);
    if (e.event === 'reverting') console.log(`  ← annulation de ${e.name}…`);
    if (e.event === 'reverted') console.log(`  ✓ ${e.name} annulée`);
  },
  warn: (e) => console.warn(e), error: (e) => console.error(e), debug() {},
};

const listerFichiers = () => fs.readdirSync(DOSSIER).filter((f) => f.endsWith('.js')).sort();

const creerUmzug = ({ verbeux = true } = {}) => new Umzug({
  migrations: () => listerFichiers().map((nom) => {
    const fichier = path.join(DOSSIER, nom);
    return {
      name: nom,
      path: fichier,
      up: (params) => require(fichier).up(params),
      down: (params) => require(fichier).down(params),
    };
  }),
  context: { queryInterface: sequelize.getQueryInterface(), sequelize, Sequelize },
  storage: new SequelizeStorage({ sequelize, tableName: 'schema_migrations' }),
  logger: verbeux ? bavard : silencieux,
});

/** Exécute `fn` en tenant le verrou de migration (session PostgreSQL dédiée). */
const avecVerrou = async (fn) => {
  const conn = await sequelize.connectionManager.getConnection();
  try {
    await conn.query(`SELECT pg_advisory_lock(${CLE_VERROU})`);
    try {
      return await fn();
    } finally {
      await conn.query(`SELECT pg_advisory_unlock(${CLE_VERROU})`);
    }
  } finally {
    sequelize.connectionManager.releaseConnection(conn);
  }
};

/** Applique toutes les migrations en attente. Renvoie les noms appliqués. */
const migrer = (options) => avecVerrou(async () => {
  const faites = await creerUmzug(options).up();
  return faites.map((m) => m.name);
});

/** Annule la dernière migration appliquée. */
const annulerDerniere = (options) => avecVerrou(async () => {
  const annulees = await creerUmzug(options).down({ step: 1 });
  return annulees.map((m) => m.name);
});

/** { appliquees: [...], enAttente: [...] } */
// Sous verrou et en séquence : chaque lecture crée la table schema_migrations si elle
// n'existe pas encore, et deux créations simultanées entrent en conflit.
const etat = () => avecVerrou(async () => {
  const umzug = creerUmzug({ verbeux: false });
  const appliquees = await umzug.executed();
  const enAttente = await umzug.pending();
  return { appliquees: appliquees.map((m) => m.name), enAttente: enAttente.map((m) => m.name) };
});

const MODELE = `// Migration : __NOM__
// up : applique le changement ; down : l'annule (pour revenir en arrière en cas de problème).
// Documentation : https://sequelize.org/docs/v6/other-topics/query-interface/
//
// Exemples :
//   await queryInterface.addColumn('users', 'ville', { type: Sequelize.STRING(100), allowNull: true });
//   await queryInterface.addIndex('rendez_vous', ['date_rdv']);
//   await queryInterface.createTable('notes', { id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true }, ... });
//
// Pensez à mettre le modèle (src/models) à jour dans le même commit.

module.exports = {
  async up({ context: { queryInterface, Sequelize } }) {
  },

  async down({ context: { queryInterface, Sequelize } }) {
  },
};
`;

/** Crée un fichier de migration vide, préfixé par la date et l'heure (tri chronologique). */
const creerMigration = (nom) => {
  const propre = String(nom || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!propre) throw new Error('Donnez un nom à la migration, ex. : npm run migration:creer -- ajouter-ville-patient');
  const horodatage = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14); // AAAAMMJJHHMMSS
  const fichier = path.join(DOSSIER, `${horodatage}-${propre}.js`);
  fs.writeFileSync(fichier, MODELE.replace('__NOM__', propre), { flag: 'wx' });
  return fichier;
};

module.exports = { migrer, annulerDerniere, etat, creerMigration, DOSSIER };
