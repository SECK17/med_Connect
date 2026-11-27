// tests/messages.test.js — chat : authentification du socket, conversations, historique paginé
const h = require('./helpers');
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { io: client } = require('socket.io-client');

let app, server, url, awa, moussa, drFall;

before(async () => {
  await h.reinitialiserBase();
  ({ app, server } = h.charger());
  await new Promise(r => server.listen(0, r)); // port libre aléatoire
  url = `http://localhost:${server.address().port}`;

  awa    = await h.creerUtilisateur('patient', { nom: 'Awa' });
  moussa = await h.creerUtilisateur('donneur', { nom: 'Moussa' });
  drFall = await h.creerUtilisateur('medecin', { nom: 'Dr Fall' });

  // 120 messages entre Awa et Moussa (alternés, non lus), puis 1 du Dr Fall à Awa
  const { Message } = h.charger().models;
  const t0 = Date.now() - 200 * 60_000;
  await Message.bulkCreate(Array.from({ length: 120 }, (_, i) => {
    const n = i + 1;
    return {
      expediteur_id: n % 2 ? moussa.user.id : awa.user.id,
      destinataire_id: n % 2 ? awa.user.id : moussa.user.id,
      contenu: `msg ${n}`,
      created_at: new Date(t0 + n * 60_000),
    };
  }));
  await Message.create({ expediteur_id: drFall.user.id, destinataire_id: awa.user.id, contenu: 'Bonjour du docteur' });
});
after(async () => {
  await new Promise(r => server.close(r));
  await h.fermer();
});

const get = (u, qui) => request(app).get(u).set('Authorization', `Bearer ${qui.token}`);

const connecter = (auth) => new Promise((resolve) => {
  const s = client(url, { auth, reconnection: false, transports: ['websocket'] });
  s.on('connect', () => resolve({ ok: true, s }));
  s.on('connect_error', (e) => { s.close(); resolve({ ok: false, message: e.message }); });
});

describe('Socket.io', () => {
  test('connexion refusée sans jeton ou avec un faux jeton', async () => {
    assert.equal((await connecter({})).ok, false);
    assert.equal((await connecter({ token: 'faux' })).ok, false);
  });

  test('l\'expéditeur vient du jeton : impossible d\'envoyer au nom d\'un autre', async () => {
    const { ok, s } = await connecter({ token: moussa.token });
    assert.ok(ok);
    // Moussa prétend être le Dr Fall
    s.emit('send_message', { expediteur_id: drFall.user.id, destinataire_id: awa.user.id, contenu: 'usurpation' });
    await new Promise(r => setTimeout(r, 300));
    s.close();
    const { Message } = h.charger().models;
    const msg = await Message.findOne({ where: { contenu: 'usurpation' } });
    assert.equal(msg.expediteur_id, moussa.user.id);
  });

  test('impossible de supprimer le message de quelqu\'un d\'autre', async () => {
    const { Message } = h.charger().models;
    const cible = await Message.findOne({ where: { contenu: 'Bonjour du docteur' } });
    const { s } = await connecter({ token: moussa.token });
    s.emit('delete_message', { message_id: cible.id, expediteur_id: drFall.user.id });
    await new Promise(r => setTimeout(r, 300));
    s.close();
    await cible.reload();
    assert.equal(cible.supprime, false);
  });
});

describe('Liste des conversations', () => {
  test('dernier message et nombre de non-lus corrects', async () => {
    const res = await get('/api/messages', awa);
    assert.equal(res.status, 200);
    const parNom = Object.fromEntries(res.body.map(c => [c.nom, c]));
    assert.equal(parNom['Dr Fall'].dernier_message, 'Bonjour du docteur');
    assert.equal(parNom['Dr Fall'].non_lus, 1);
    assert.equal(parNom['Moussa'].non_lus, 61); // 60 impairs + le message "usurpation"
  });
});

describe('Historique paginé', () => {
  test('pages de 50, du plus ancien au plus récent, sans doublon', async () => {
    const vus = new Set();
    let before = '';
    const tailles = [];
    for (;;) {
      const res = await get(`/api/messages/${moussa.user.id}?limit=50${before}`, awa);
      assert.equal(res.status, 200);
      res.body.forEach(m => { assert.ok(!vus.has(m.id), 'doublon'); vus.add(m.id); });
      tailles.push(res.body.length);
      const dates = res.body.map(m => new Date(m.created_at).getTime());
      assert.deepEqual(dates, [...dates].sort((a, b) => a - b), 'ordre chronologique');
      if (res.headers['x-has-more'] !== 'true') break;
      before = `&before=${res.body[0].id}`;
    }
    assert.deepEqual(tailles, [50, 50, 21]); // 120 + "usurpation"
  });

  test('ouvrir la conversation marque les messages comme lus', async () => {
    const res = await get('/api/messages', awa);
    const moussaConv = res.body.find(c => c.nom === 'Moussa');
    assert.equal(moussaConv.non_lus, 0);
  });
});
