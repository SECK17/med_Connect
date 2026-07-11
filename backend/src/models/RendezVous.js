const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Modèle RendezVous
 * Représente un rendez-vous entre un patient et un médecin
 */
const RendezVous = sequelize.define('RendezVous', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'patients',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  medecin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'medecins',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  date_rdv: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  heure: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  motif: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  statut: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'en_attente',
  },
}, {
  tableName: 'rendez_vous',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = RendezVous;

