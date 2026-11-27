const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { valider } = require('../validation');
const S = require('../validation/schemas');
const {
  clePublique,
  abonner,
  desabonner,
} = require('../controllers/pushController');

// GET /api/push/vapid-public-key
router.get('/vapid-public-key', clePublique);

// POST /api/push/subscribe
router.post('/subscribe', authenticate, valider({ body: S.push.abonner }), abonner);

// DELETE /api/push/unsubscribe
router.delete('/unsubscribe', authenticate, desabonner);

module.exports = router;
