# Image du backend MedConnect (API Express + Socket.io)
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Dépendances d'abord : cette couche est réutilisée tant que package*.json ne change pas
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .
# Dossier des fichiers médicaux envoyés : monté sur un volume, doit appartenir à « node »
RUN mkdir -p uploads && chown -R node:node uploads

# Pas de root dans le conteneur
USER node

EXPOSE 5000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"

# Au démarrage : migrations de la base, puis lancement de l'API (voir server.js)
CMD ["node", "server.js"]
