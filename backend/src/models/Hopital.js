const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Modèle Hopital
 * Représente un hôpital ou établissement de santé
 */
const Hopital = sequelize.define('Hopital', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('Hôpital', 'Clinique', 'CHU', 'Centre'),
    allowNull: false,
    defaultValue: 'Hôpital',
  },
  ville: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  adresse: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'hopitaux',
  timestamps: true,
});

module.exports = Hopital;
