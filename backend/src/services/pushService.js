const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

const hasVapidConfig = !!(
  process.env.VAPID_EMAIL &&
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
);

if (hasVapidConfig) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
} else {
  console.warn('⚠️ VAPID keys missing. Push notifications are disabled until .env is configured.');
}

const sendPush = async (userId, payload) => {
  if (!hasVapidConfig) return;

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
