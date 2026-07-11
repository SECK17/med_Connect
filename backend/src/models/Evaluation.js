const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Evaluation = sequelize.define("Evaluation", {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  patient_id:  { type: DataTypes.INTEGER, allowNull: false },
  medecin_id:  { type: DataTypes.INTEGER, allowNull: false },
  rdv_id:      { type: DataTypes.INTEGER, allowNull: true },
  note:        { type: DataTypes.INTEGER, allowNull: false }, // 1-5
  commentaire: { type: DataTypes.TEXT,    allowNull: true  },
}, {
  tableName:  "evaluations",
  underscored: true,
  indexes: [{ unique: true, fields: ["patient_id", "medecin_id"] }],
});

module.exports = Evaluation;
