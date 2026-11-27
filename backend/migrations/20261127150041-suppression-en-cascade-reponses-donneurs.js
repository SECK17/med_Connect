// Migration : suppression-en-cascade-reponses-donneurs
// Les réponses des donneurs (donneur_reponses) bloquaient la suppression d'une alerte ou
// d'un compte donneur : leurs clés étrangères n'avaient pas de règle ON DELETE (erreur 500).
// Elles sont maintenant supprimées avec l'alerte ou le compte, comme les autres données liées.

const changer = (sequelize, regle) => sequelize.transaction((transaction) => sequelize.query(`
  ALTER TABLE donneur_reponses DROP CONSTRAINT IF EXISTS donneur_reponses_alerte_id_fkey;
  ALTER TABLE donneur_reponses ADD CONSTRAINT donneur_reponses_alerte_id_fkey
    FOREIGN KEY (alerte_id) REFERENCES alertes_sang(id) ON UPDATE CASCADE ${regle};
  ALTER TABLE donneur_reponses DROP CONSTRAINT IF EXISTS donneur_reponses_donneur_id_fkey;
  ALTER TABLE donneur_reponses ADD CONSTRAINT donneur_reponses_donneur_id_fkey
    FOREIGN KEY (donneur_id) REFERENCES users(id) ON UPDATE CASCADE ${regle};
`, { transaction }));

module.exports = {
  async up({ context: { sequelize } }) {
    await changer(sequelize, 'ON DELETE CASCADE');
  },

  async down({ context: { sequelize } }) {
    await changer(sequelize, '');
  },
};
