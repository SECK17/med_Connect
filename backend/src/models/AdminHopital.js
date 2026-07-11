const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AdminHopital = sequelize.define('AdminHopital', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: {
    type: DataTypes.INTEGER, allowNull: false, unique: true,
    references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
  },
  hopital_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'hopitaux', key: 'id' }, onDelete: 'CASCADE',
  },
  hopital_nom: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'admin_hopitaux',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = AdminHopital;
