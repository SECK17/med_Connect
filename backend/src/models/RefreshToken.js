// models/RefreshToken.js
// Jetons de rafraîchissement (sessions). Seul le hash SHA-256 est stocké :
// une fuite de la base ne permet pas de réutiliser les jetons.
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const RefreshToken = sequelize.define('RefreshToken', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  token_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  revoked_at: { type: DataTypes.DATE, allowNull: true },
  // 'rotation' | 'logout' | 'logout_all' | 'mot_de_passe' | 'reutilisation' | 'compte'
  revoked_reason: { type: DataTypes.STRING(20), allowNull: true },
  user_agent: { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName: 'refresh_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [{ fields: ['user_id'] }],
});

module.exports = RefreshToken;
