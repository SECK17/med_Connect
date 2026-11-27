// Migration : unicite-abonnements-push
// L'abonnement aux notifications fait un « insérer ou mettre à jour » sur (user_id, endpoint),
// ce qui exige une contrainte d'unicité sur ce couple. Sans elle, chaque abonnement échouait.
// Les doublons éventuels sont d'abord supprimés (on garde le plus récent).

module.exports = {
  async up({ context: { sequelize } }) {
    await sequelize.transaction(async (transaction) => {
      await sequelize.query(`
        DELETE FROM push_subscriptions a
        USING push_subscriptions b
        WHERE a.user_id = b.user_id AND a.endpoint = b.endpoint AND a.id < b.id`, { transaction });
      await sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_user_id_endpoint
        ON push_subscriptions (user_id, endpoint)`, { transaction });
    });
  },

  async down({ context: { queryInterface } }) {
    await queryInterface.removeIndex('push_subscriptions', 'push_subscriptions_user_id_endpoint');
  },
};
