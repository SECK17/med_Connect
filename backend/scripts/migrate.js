#!/usr/bin/env node
// scripts/migrate.js — commandes de migration (voir migrations/README.md)
//   npm run migrate                       applique les migrations en attente
//   npm run migrate:statut                liste les migrations appliquées / en attente
//   npm run migrate:annuler               annule la dernière migration
//   npm run migration:creer -- <nom>      crée un fichier de migration vide
require('dotenv').config({ quiet: true });
const { sequelize } = require('../src/config/db');
const { migrer, annulerDerniere, etat, creerMigration } = require('../src/db/migrations');
const { verifierSchema } = require('../src/db/verifierSchema');

const [commande = 'up', ...args] = process.argv.slice(2);

const main = async () => {
  switch (commande) {
    case 'up': {
      console.log(`Migrations sur la base « ${process.env.DB_NAME} »`);
      const faites = await migrer();
      console.log(faites.length ? `${faites.length} migration(s) appliquée(s).` : 'Base déjà à jour.');
      const ecarts = await verifierSchema();
      if (ecarts.length) {
        console.warn('⚠️  Écarts entre les modèles et la base :\n  - ' + ecarts.join('\n  - '));
        process.exitCode = 1;
      }
      break;
    }
    case 'statut': {
      const { appliquees, enAttente } = await etat();
      console.log(`Appliquées (${appliquees.length}) :`);
      appliquees.forEach((n) => console.log(`  ✓ ${n}`));
      console.log(`En attente (${enAttente.length}) :`);
      enAttente.forEach((n) => console.log(`  • ${n}`));
      break;
    }
    case 'annuler': {
      const annulees = await annulerDerniere();
      console.log(annulees.length ? `Annulée : ${annulees.join(', ')}` : 'Aucune migration à annuler.');
      break;
    }
    case 'creer': {
      console.log('Créée :', creerMigration(args.join('-')));
      return; // pas de connexion à la base nécessaire
    }
    default:
      console.error(`Commande inconnue : ${commande} (up | statut | annuler | creer <nom>)`);
      process.exitCode = 1;
  }
};

main()
  .catch((err) => { console.error('❌', err.message); process.exitCode = 1; })
  .finally(() => sequelize.close());
