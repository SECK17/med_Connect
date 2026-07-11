// models/Medecin.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Medecin = sequelize.define(
  "Medecin",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    specialite: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    numLicence: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "num_licence",
    },
    valide: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    disponible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    hopital: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    experience: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    tarif: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    disponibilites: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "medecins",
    timestamps: false,
    underscored: true,
  }
);

module.exports = Medecin;