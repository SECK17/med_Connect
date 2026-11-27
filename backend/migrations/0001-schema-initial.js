// Migration de référence : schéma complet de MedConnect au moment de l'adoption des migrations.
// Le SQL (0001-schema-initial.sql) est idempotent : il crée une base neuve ou complète une
// base existante créée autrefois par sequelize.sync(), sans toucher aux données.
const fs = require('fs');
const path = require('path');

module.exports = {
  async up({ context: { sequelize } }) {
    const sql = fs.readFileSync(path.join(__dirname, '0001-schema-initial.sql'), 'utf8');
    await sequelize.transaction((transaction) => sequelize.query(sql, { transaction }));
  },

  async down() {
    throw new Error(
      "La migration de référence ne s'annule pas (elle supprimerait toutes les données). " +
      'Pour repartir de zéro sur une base de développement : DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
    );
  },
};
