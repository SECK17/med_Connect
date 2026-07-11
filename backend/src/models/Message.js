const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Message = sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  expediteur_id:  { type: DataTypes.INTEGER, allowNull: false },
  destinataire_id: { type: DataTypes.INTEGER, allowNull: false },
  contenu:    { type: DataTypes.TEXT,    allowNull: false },
  lu:         { type: DataTypes.BOOLEAN, defaultValue: false },
  supprime:   { type: DataTypes.BOOLEAN, defaultValue: false },
  modifie:    { type: DataTypes.BOOLEAN, defaultValue: false },
  modifie_at: { type: DataTypes.DATE,    allowNull: true },
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Message;
