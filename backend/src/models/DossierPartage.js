const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DossierPartage = sequelize.define('DossierPartage', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  patient_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
  },
  medecin_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
  },
}, {
  tableName: 'dossier_partages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [{ unique: true, fields: ['patient_id', 'medecin_id'] }],
});

module.exports = DossierPartage;
