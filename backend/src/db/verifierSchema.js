// db/verifierSchema.js — compare les modèles Sequelize à la base réelle.
// Détecte un modèle modifié sans migration correspondante (table ou colonne absente,
// colonne obligatoire dans le modèle mais facultative en base, ou l'inverse).
// Utilisé au démarrage (avertissement) et dans les tests (échec).
const { sequelize } = require('../config/db');

const verifierSchema = async () => {
  require('../models'); // enregistre tous les modèles
  const qi = sequelize.getQueryInterface();
  const tables = new Set((await qi.showAllTables()).map((t) => (typeof t === 'string' ? t : t.tableName)));
  const ecarts = [];

  for (const model of Object.values(sequelize.models)) {
    const table = model.getTableName();
    const nomTable = typeof table === 'string' ? table : table.tableName;
    if (!tables.has(nomTable)) {
      ecarts.push(`table « ${nomTable} » absente (modèle ${model.name})`);
      continue;
    }
    const colonnes = await qi.describeTable(nomTable);
    for (const attr of Object.values(model.rawAttributes)) {
      if (attr.type?.key === 'VIRTUAL') continue;
      const col = colonnes[attr.field];
      if (!col) {
        ecarts.push(`colonne « ${nomTable}.${attr.field} » absente (modèle ${model.name})`);
        continue;
      }
      const obligatoireModele = attr.allowNull === false || attr.primaryKey === true;
      if (obligatoireModele !== !col.allowNull) {
        ecarts.push(`colonne « ${nomTable}.${attr.field} » : ${obligatoireModele ? 'obligatoire' : 'facultative'} dans le modèle, ${col.allowNull ? 'facultative' : 'obligatoire'} en base`);
      }
    }
  }
  return ecarts;
};

module.exports = { verifierSchema };
