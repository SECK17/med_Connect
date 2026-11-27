const { Sequelize } = require('sequelize');
require('dotenv').config();

// On crée la connexion avec les infos du fichier .env
const sequelize = new Sequelize(
  process.env.DB_NAME,      // medconnect
  process.env.DB_USER,      // postgres
  process.env.DB_PASSWORD,  // ton mot de passe
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',    // on dit à Sequelize qu'on utilise PostgreSQL
    logging: false,         // désactive les logs SQL dans le terminal
  }
);

// Fonction pour tester la connexion
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Base de données connectée ✓');
  } catch (error) {
    console.error('Erreur de connexion à la BDD :', error.message);
    throw error; // arrête le démarrage du serveur au lieu de continuer sans BDD
  }
};

module.exports = { sequelize, connectDB };