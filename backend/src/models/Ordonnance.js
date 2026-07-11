const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Ordonnance = sequelize.define('Ordonnance', {
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
    allowNull: true,
  },
  medicaments: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('medicaments');
      if (!raw) return [];
      try { return JSON.parse(raw); } catch { return []; }
    },
    set(val) {
      this.setDataValue('medicaments', val ? JSON.stringify(val) : null);
    },
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
  tableName: 'ordonnances',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Ordonnance;
