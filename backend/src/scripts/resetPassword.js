/**
 * Reset a user's password directly in the database.
 * Usage: node src/scripts/resetPassword.js <email> <new_password>
 * Example: node src/scripts/resetPassword.js test@test.com monMotDePasse123
 */
const bcrypt = require("bcryptjs");
require("dotenv").config();

const { sequelize } = require("../config/db");
const User = require("../models/User");

const [,, email, newPassword] = process.argv;

if (!email || !newPassword) {
  console.error("Usage: node src/scripts/resetPassword.js <email> <nouveau_mot_de_passe>");
  process.exit(1);
}

(async () => {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      process.exit(1);
    }

    // Hash manually (bypass beforeUpdate hook to avoid double hashing)
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashed }, { where: { email }, hooks: false });

    console.log(`✅ Mot de passe réinitialisé pour ${email} (id: ${user.id}, rôle: ${user.role})`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur:", err.message);
    process.exit(1);
  }
})();
