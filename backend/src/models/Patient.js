// models/Patient.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Patient = sequelize.define(
  "Patient",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    dateNaissance: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "date_naissance",
    },
    adresse: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    groupeSanguin: {
      type: DataTypes.ENUM("A+","A-","B+","B-","AB+","AB-","O+","O-"),
      allowNull: true,
      field: "groupe_sanguin",
    },
    donneurDisponible: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "donneur_disponible",
    },
    latitude:  { type: DataTypes.FLOAT, allowNull: true },
    longitude: { type: DataTypes.FLOAT, allowNull: true },
  },
  {
    tableName: "patients",
    timestamps: false,
    underscored: true,
  }
);

module.exports = Patient;