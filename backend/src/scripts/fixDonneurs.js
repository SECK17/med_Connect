/**
 * Met à jour les donneurs existants : donneurDisponible = true pour tous les users role='donneur'
 * Usage: node src/scripts/fixDonneurs.js
 */
require("dotenv").config();
const { sequelize } = require("../config/db");
const User    = require("../models/User");
const Patient = require("../models/Patient");

(async () => {
  try {
    await sequelize.authenticate();

    const donneurs = await User.findAll({ where: { role: "donneur" } });
    console.log(`${donneurs.length} donneur(s) trouvé(s)`);

    let updated = 0;
    for (const u of donneurs) {
      const patient = await Patient.findByPk(u.id);
      if (!patient) {
        await Patient.create({ id: u.id, donneurDisponible: true });
        console.log(`  ✅ Profil patient créé pour ${u.email}`);
        updated++;
      } else if (!patient.donneurDisponible) {
        await patient.update({ donneurDisponible: true }, { hooks: false });
        console.log(`  ✅ donneurDisponible activé pour ${u.email}`);
        updated++;
      } else {
        console.log(`  — Déjà correct : ${u.email}`);
      }
    }

    console.log(`\n${updated} donneur(s) mis à jour ✓`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur:", err.message);
    process.exit(1);
  }
})();
