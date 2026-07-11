const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DonneurReponse = sequelize.define('DonneurReponse', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  alerte_id:  { type: DataTypes.INTEGER, allowNull: false },
  donneur_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'donneur_reponses',
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ['alerte_id', 'donneur_id'] }],
});

module.exports = DonneurReponse;
