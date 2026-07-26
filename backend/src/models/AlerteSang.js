const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Matrice de compatibilité : groupe demandé → groupes donneurs acceptés
const COMPAT = {
  'O-':  ['O-'],
  'O+':  ['O-', 'O+'],
  'A-':  ['O-', 'A-'],
  'A+':  ['O-', 'O+', 'A-', 'A+'],
  'B-':  ['O-', 'B-'],
  'B+':  ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

const AlerteSang = sequelize.define('AlerteSang', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  hopital_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'hopitaux', key: 'id' }, onDelete: 'CASCADE',
  },
  hopital_nom: { type: DataTypes.STRING, allowNull: false },
  admin_id:   { type: DataTypes.INTEGER, allowNull: false },
  groupe_sang: {
    type: DataTypes.ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-'),
    allowNull: false,
  },
  groupes_donneurs: {
    type: DataTypes.JSON, allowNull: false,
    comment: 'Groupes sanguins des donneurs compatibles',
  },
  quantite:  { type: DataTypes.STRING(50), allowNull: true },
  message:   { type: DataTypes.TEXT, allowNull: true },
  urgence: {
    type: DataTypes.ENUM('Faible','Moyen','Urgent','Critique'),
    allowNull: false, defaultValue: 'Urgent',
  },
  statut: {
    type: DataTypes.ENUM('active','terminee','annulee'),
    allowNull: false, defaultValue: 'active',
  },
  latitude:  { type: DataTypes.FLOAT, allowNull: true },
  longitude: { type: DataTypes.FLOAT, allowNull: true },
  rayon_km:   { type: DataTypes.INTEGER, allowNull: true },
  duree_heures: { type: DataTypes.INTEGER, allowNull: true, comment: 'Durée de validité en heures (null = illimitée)' },
  expire_at:  { type: DataTypes.DATE, allowNull: true, comment: 'Date/heure d\'expiration automatique' },
}, {
  tableName: 'alertes_sang',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

AlerteSang.COMPAT = COMPAT;

module.exports = AlerteSang;
