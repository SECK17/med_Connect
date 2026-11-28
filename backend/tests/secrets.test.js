// tests/secrets.test.js — contrôle de JWT_SECRET et ADMIN_CODE au démarrage (sans base de données)
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { analyserSecrets, verifierSecrets } = require('../src/config/verifierSecrets');

describe('Contrôle des secrets au démarrage', () => {
  const FORT = 'a'.repeat(16) + 'b'.repeat(16) + 'c';

  test('JWT_SECRET absent : refus, même en développement', () => {
    assert.throws(() => verifierSecrets({ NODE_ENV: 'development' }), /JWT_SECRET n'est pas défini/);
  });

  test('valeurs d’exemple de .env.example : refus en production', () => {
    const { erreurs } = analyserSecrets({
      NODE_ENV: 'production', JWT_SECRET: 'your_jwt_secret_key_here', ADMIN_CODE: 'admin_secret_code_here',
    });
    assert.equal(erreurs.length, 2);
    assert.match(erreurs.join(' '), /JWT_SECRET a encore sa valeur d'exemple/);
    assert.match(erreurs.join(' '), /ADMIN_CODE a encore sa valeur d'exemple/);
  });

  test('secret trop court : refus en production, avertissement en développement', () => {
    const env = { JWT_SECRET: 'court-mais-pas-exemple', ADMIN_CODE: FORT };
    assert.match(analyserSecrets({ ...env, NODE_ENV: 'production' }).erreurs[0], /trop court/);
    const dev = analyserSecrets({ ...env, NODE_ENV: 'development' });
    assert.equal(dev.erreurs.length, 0);
    assert.match(dev.avertissements[0], /trop court/);
  });

  test('secrets forts : aucun problème en production ; ADMIN_CODE peut être absent', () => {
    assert.deepEqual(analyserSecrets({ NODE_ENV: 'production', JWT_SECRET: FORT, ADMIN_CODE: FORT }),
      { erreurs: [], avertissements: [] });
    assert.doesNotThrow(() => verifierSecrets({ NODE_ENV: 'production', JWT_SECRET: FORT }));
  });
});
