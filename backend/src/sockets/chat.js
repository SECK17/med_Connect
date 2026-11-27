// sockets/chat.js — messagerie en temps réel (Socket.io)
// Événements reçus : join_user, join_chat, send_message, delete_message, edit_message
// Événements émis  : message_received, new_message_notif, message_deleted, message_edited
const Message          = require('../models/Message');
const { sendPush }     = require('../services/pushService');
const { verifierJetonAcces } = require('../services/tokenService');

// Salle d'une conversation : la même quel que soit l'ordre des deux participants
const roomId = (a, b) => `chat_${Math.min(a, b)}_${Math.max(a, b)}`;

module.exports = (io) => {
  // Authentification : chaque socket doit fournir un JWT valide (auth: { token }).
  // L'identité vient du token, jamais des données envoyées par le client.
  io.use(async (socket, next) => {
    try {
      const { user, erreur } = await verifierJetonAcces(socket.handshake.auth?.token);
      if (erreur) return next(new Error(erreur));
      socket.user = user; // { id, role }
      next();
    } catch {
      next(new Error('TOKEN_INVALIDE'));
    }
  });

  io.on('connection', (socket) => {
    const meId = socket.user.id;

    // Chaque utilisateur ne peut rejoindre que sa propre room de notifications
    socket.join(`user_${meId}`);
    socket.on('join_user', () => {
      socket.join(`user_${meId}`);
    });

    socket.on('join_chat', ({ interlocuteurId } = {}) => {
      const autre = parseInt(interlocuteurId, 10);
      if (!autre) return;
      socket.join(roomId(meId, autre));
    });

    socket.on('send_message', async ({ destinataire_id, contenu } = {}) => {
      try {
        destinataire_id = parseInt(destinataire_id, 10);
        if (!destinataire_id || typeof contenu !== 'string') return;
        contenu = contenu.trim();
        if (!contenu || contenu.length > 5000) return;
        const expediteur_id = meId;
        const msg = await Message.create({ expediteur_id, destinataire_id, contenu });
        const room = roomId(expediteur_id, destinataire_id);
        io.to(room).emit('message_received', msg);
        io.to(`user_${destinataire_id}`).emit('new_message_notif', {
          from_id: expediteur_id,
          contenu,
          date: msg.created_at,
        });
        // Notification push au destinataire
        sendPush(destinataire_id, {
          title: 'Nouveau message',
          body: contenu.length > 60 ? contenu.slice(0, 60) + '…' : contenu,
          icon: '/favicon.svg',
          url: '/dashboard',
        });
      } catch (err) {
        console.error('Erreur socket send_message:', err);
      }
    });

    socket.on('delete_message', async ({ message_id } = {}) => {
      try {
        const msg = await Message.findByPk(message_id);
        if (!msg || msg.expediteur_id !== meId) return;
        await msg.update({ supprime: true });
        const room = roomId(msg.expediteur_id, msg.destinataire_id);
        io.to(room).emit('message_deleted', { id: message_id });
      } catch (err) {
        console.error('Erreur socket delete_message:', err);
      }
    });

    socket.on('edit_message', async ({ message_id, nouveau_contenu } = {}) => {
      try {
        if (typeof nouveau_contenu !== 'string') return;
        nouveau_contenu = nouveau_contenu.trim();
        if (!nouveau_contenu || nouveau_contenu.length > 5000) return;
        const msg = await Message.findByPk(message_id);
        if (!msg || msg.expediteur_id !== meId || msg.supprime) return;
        await msg.update({ contenu: nouveau_contenu, modifie: true, modifie_at: new Date() });
        const room = roomId(msg.expediteur_id, msg.destinataire_id);
        io.to(room).emit('message_edited', { id: message_id, contenu: nouveau_contenu });
      } catch (err) {
        console.error('Erreur socket edit_message:', err);
      }
    });
  });
};
