const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DemandeHopital = sequelize.define('DemandeHopital', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  medecin_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
  },
  hopital_actuel:  { type: DataTypes.STRING(200), allowNull: true },
  hopital_demande: { type: DataTypes.STRING(200), allowNull: false },
  justificatif:    { type: DataTypes.STRING(500), allowNull: true },
  statut: {
    type: DataTypes.STRING(20),
    defaultValue: 'en_attente',
    validate: { isIn: [['en_attente', 'validee', 'rejetee', 'annulee']] },
  },
  motif_rejet: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'demandes_hopital',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = DemandeHopital;
