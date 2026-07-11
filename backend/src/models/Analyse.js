const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Analyse = sequelize.define('Analyse', {
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
  fichier: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'analyses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Analyse;
