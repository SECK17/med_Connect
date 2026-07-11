const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

const sendPush = async (userId, payload) => {
  try {
    const subs = await PushSubscription.findAll({ where: { user_id: userId } });
    const promises = subs.map(s =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      ).catch(async (err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await s.destroy();
        }
      })
    );
    await Promise.all(promises);
  } catch (err) {
    console.error('Push error:', err.message);
  }
};

module.exports = { sendPush };
