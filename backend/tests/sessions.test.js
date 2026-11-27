// tests/sessions.test.js — jeton d'accès court, cookie de rafraîchissement, déconnexion, révocation
const h = require('./helpers');
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');

let app;
before(async () => {
  await h.reinitialiserBase();
  app = h.charger().app;
});
after(h.fermer);

const MDP = 'motdepasse123';

/** Connexion : renvoie { token, cookie } (cookie = "medconnect_refresh=..."). */
const connexion = async (email, password = MDP) => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  assert.equal(res.status, 200, res.body.message);
  const brut = res.headers['set-cookie'].find(c => c.startsWith('medconnect_refresh='));
  return { token: res.body.token, cookie: brut.split(';')[0], setCookie: brut };
};
const refresh = (cookie) => {
  const r = request(app).post('/api/auth/refresh');
  return cookie ? r.set('Cookie', cookie) : r;
};
const appelProtege = (token) => request(app).get('/api/messages').set('Authorization', `Bearer ${token}`);
const nouveauCookie = (res) => res.headers['set-cookie']?.find(c => c.startsWith('medconnect_refresh='))?.split(';')[0];

describe('Connexion', () => {
  test('jeton d\'accès court (15 min) et cookie httpOnly limité à /api/auth', async () => {
    const { user } = await h.creerUtilisateur('patient', { email: 'c1@t.sn' });
    const { token, setCookie } = await connexion('c1@t.sn');
    const { exp, iat, tv } = jwt.decode(token);
    assert.equal(exp - iat, 15 * 60);
    assert.equal(tv, 0);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /Path=\/api\/auth/);
    assert.match(setCookie, /SameSite=Lax/i);
    assert.equal((await appelProtege(token)).status, 200);
    assert.ok(user);
  });

  test('un ancien jeton sans version (avant la mise à jour) est refusé', async () => {
    const { user } = await h.creerUtilisateur('patient');
    const ancien = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const res = await appelProtege(ancien);
    assert.equal(res.status, 401);
  });

  test('un jeton expiré renvoie le code TOKEN_EXPIRE (le frontend sait qu\'il doit rafraîchir)', async () => {
    const { user } = await h.creerUtilisateur('patient');
    const expire = jwt.sign({ id: user.id, role: user.role, tv: 0 }, process.env.JWT_SECRET, { expiresIn: -10 });
    const res = await appelProtege(expire);
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'TOKEN_EXPIRE');
  });
});

describe('Rafraîchissement', () => {
  test('sans cookie : 401', async () => {
    const res = await refresh();
    assert.equal(res.status, 401);
  });

  test('renvoie un nouveau jeton d\'accès, les infos utilisateur et un NOUVEAU cookie', async () => {
    await h.creerUtilisateur('patient', { email: 'r1@t.sn', nom: 'Rokhaya' });
    const { cookie } = await connexion('r1@t.sn');
    const res = await refresh(cookie);
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.nom, 'Rokhaya');
    const suivant = nouveauCookie(res);
    assert.ok(suivant && suivant !== cookie, 'le cookie est remplacé à chaque rafraîchissement');
    assert.equal((await appelProtege(res.body.token)).status, 200);
  });

  test('deux onglets qui rafraîchissent en même temps : toléré', async () => {
    await h.creerUtilisateur('patient', { email: 'r2@t.sn' });
    const { cookie } = await connexion('r2@t.sn');
    const [a, b] = await Promise.all([refresh(cookie), refresh(cookie)]);
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
  });

  test('réutilisation d\'un ancien cookie après le délai de grâce : toutes les sessions sont coupées', async () => {
    const { user } = await h.creerUtilisateur('patient', { email: 'r3@t.sn' });
    const { cookie: vole } = await connexion('r3@t.sn');
    const legit = await refresh(vole);                 // l'utilisateur légitime rafraîchit
    const cookieLegit = nouveauCookie(legit);
    process.env.REFRESH_REUSE_GRACE_MS = '0';          // fin du délai de grâce
    try {
      const attaque = await refresh(vole);             // l'attaquant rejoue l'ancien cookie
      assert.equal(attaque.status, 401);
      assert.equal((await refresh(cookieLegit)).status, 401, 'la session légitime est aussi coupée');
      assert.equal((await appelProtege(legit.body.token)).status, 401, 'les jetons d\'accès sont invalidés');
    } finally {
      delete process.env.REFRESH_REUSE_GRACE_MS;
    }
    assert.ok(user);
  });

  test('un médecin dé-validé ne peut plus rafraîchir sa session', async () => {
    const { user } = await h.creerUtilisateur('medecin', { email: 'dr@t.sn' });
    const { cookie, token } = await connexion('dr@t.sn');
    await h.charger().models.Medecin.update({ valide: false }, { where: { id: user.id } });
    assert.equal((await refresh(cookie)).status, 401);
    assert.equal((await appelProtege(token)).status, 401, 'son jeton d\'accès est révoqué');
  });
});

describe('Déconnexion', () => {
  test('logout révoque le cookie de cet appareil (même sans jeton d\'accès)', async () => {
    await h.creerUtilisateur('patient', { email: 'l1@t.sn' });
    const { cookie } = await connexion('l1@t.sn');
    const res = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    assert.equal(res.status, 200);
    assert.match(res.headers['set-cookie'].join(';'), /medconnect_refresh=;/);
    assert.equal((await refresh(cookie)).status, 401);
  });

  test('logout d\'un appareil ne déconnecte pas les autres', async () => {
    await h.creerUtilisateur('patient', { email: 'l2@t.sn' });
    const pc = await connexion('l2@t.sn');
    const tel = await connexion('l2@t.sn');
    await request(app).post('/api/auth/logout').set('Cookie', pc.cookie);
    assert.equal((await refresh(tel.cookie)).status, 200);
  });

  test('logout-all coupe tous les appareils immédiatement, jetons d\'accès compris', async () => {
    await h.creerUtilisateur('patient', { email: 'l3@t.sn' });
    const pc = await connexion('l3@t.sn');
    const tel = await connexion('l3@t.sn');
    const res = await request(app).post('/api/auth/logout-all').set('Authorization', `Bearer ${pc.token}`);
    assert.equal(res.status, 200);
    assert.equal((await appelProtege(tel.token)).status, 401);
    assert.equal((await appelProtege(pc.token)).status, 401);
    assert.equal((await refresh(tel.cookie)).status, 401);
    // Une nouvelle connexion fonctionne
    const re = await connexion('l3@t.sn');
    assert.equal((await appelProtege(re.token)).status, 200);
  });

  test('changer son mot de passe déconnecte tous les appareils', async () => {
    await h.creerUtilisateur('patient', { email: 'l4@t.sn' });
    const session = await connexion('l4@t.sn');
    await request(app).post('/api/auth/forgot-password').send({ email: 'l4@t.sn' });
    const { token: lien } = h.dernierEmail('l4@t.sn', 'reset-password');
    assert.equal((await request(app).post('/api/auth/reset-password').send({ token: lien, password: 'nouveaumdp1' })).status, 200);
    assert.equal((await appelProtege(session.token)).status, 401);
    assert.equal((await refresh(session.cookie)).status, 401);
  });

  test('un socket ne peut plus se connecter avec un jeton révoqué', async () => {
    const { io: client } = require('socket.io-client');
    const { server } = h.charger();
    await new Promise(r => server.listen(0, r));
    try {
      await h.creerUtilisateur('patient', { email: 'l5@t.sn' });
      const { token } = await connexion('l5@t.sn');
      await request(app).post('/api/auth/logout-all').set('Authorization', `Bearer ${token}`);
      const res = await new Promise((resolve) => {
        const s = client(`http://localhost:${server.address().port}`, { auth: { token }, reconnection: false, transports: ['websocket'] });
        s.on('connect', () => { s.close(); resolve('connecté'); });
        s.on('connect_error', (e) => { s.close(); resolve(e.message); });
      });
      assert.equal(res, 'TOKEN_REVOQUE');
    } finally {
      await new Promise(r => server.close(r));
    }
  });
});
