// models/User.js
const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const { sequelize } = require("../config/db");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: "patient",
    validate: {
      isIn: [["patient", "medecin", "donneur", "admin", "admin_hopital"]],
    },
  },
  photo: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  // true par défaut : les comptes existants et ceux créés par un admin sont considérés vérifiés.
  // L'inscription publique (register) le met à false jusqu'au clic sur le lien reçu par email.
  email_verifie: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  // Incrémenté pour invalider immédiatement tous les jetons d'accès de l'utilisateur
  // (déconnexion de tous les appareils, changement de mot de passe).
  token_version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: "users",
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
  },
});

// Méthode pour comparer les mots de passe
User.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = User;