const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Consultation = sequelize.define('Consultation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'patients', key: 'id' },
    onDelete: 'CASCADE',
  },
  medecin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'medecins', key: 'id' },
    onDelete: 'CASCADE',
  },
  rdv_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'rendez_vous', key: 'id' },
    onDelete: 'SET NULL',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  hopital: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  motif: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  diagnostic: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  traitement: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'consultations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Consultation;
