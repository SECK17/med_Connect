// models/JournalAcces.js
// Journal d'accès aux dossiers médicaux : qui a lu / créé / modifié / supprimé
// quelle donnée de quel patient, quand, et si l'accès a été accordé ou refusé.
//
// Volontairement SANS clé étrangère : le journal doit survivre à la suppression
// d'un compte (on garde l'identifiant et un instantané du nom et du rôle).
// Le journal est en ajout seul : toute modification ou suppression via l'ORM est refusée.
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ACTIONS = ['lecture', 'creation', 'modification', 'suppression', 'telechargement'];

const JournalAcces = sequelize.define('JournalAcces', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  acteur_id:   { type: DataTypes.INTEGER, allowNull: false },
  acteur_nom:  { type: DataTypes.STRING(100), allowNull: true },
  acteur_role: { type: DataTypes.STRING(50), allowNull: false },
  patient_id:  { type: DataTypes.INTEGER, allowNull: true },
  action:      { type: DataTypes.STRING(20), allowNull: false, validate: { isIn: [ACTIONS] } },
  // profil | rendezvous | ordonnances | analyses | consultations | partages | fichier
  ressource:    { type: DataTypes.STRING(30), allowNull: false },
  ressource_id: { type: DataTypes.INTEGER, allowNull: true },
  details:      { type: DataTypes.STRING(255), allowNull: true },
  autorise:     { type: DataTypes.BOOLEAN, allowNull: false },
  statut_http:  { type: DataTypes.SMALLINT, allowNull: false },
  methode:      { type: DataTypes.STRING(10), allowNull: false },
  chemin:       { type: DataTypes.STRING(255), allowNull: false },
  ip:           { type: DataTypes.STRING(64), allowNull: true },
  user_agent:   { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName: 'journal_acces',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['patient_id', 'created_at'] },
    { fields: ['acteur_id', 'created_at'] },
    { fields: ['created_at'] },
  ],
  hooks: {
    beforeUpdate: () => { throw new Error("Le journal d'accès ne peut pas être modifié."); },
    beforeBulkUpdate: () => { throw new Error("Le journal d'accès ne peut pas être modifié."); },
    beforeDestroy: () => { throw new Error("Le journal d'accès ne peut pas être supprimé."); },
  },
});

JournalAcces.ACTIONS = ACTIONS;
module.exports = JournalAcces;
