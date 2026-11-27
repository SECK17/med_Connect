const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PushSubscription = sequelize.define('PushSubscription', {
  id:       { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id:  { type: DataTypes.INTEGER, allowNull: false },
  endpoint: { type: DataTypes.TEXT,    allowNull: false },
  p256dh:   { type: DataTypes.TEXT,    allowNull: false },
  auth:     { type: DataTypes.TEXT,    allowNull: false },
}, {
  tableName: 'push_subscriptions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  // Un abonnement par appareil (endpoint) et par utilisateur — migration 20261127145858
  indexes: [{ unique: true, fields: ['user_id', 'endpoint'], name: 'push_subscriptions_user_id_endpoint' }],
});

module.exports = PushSubscription;
