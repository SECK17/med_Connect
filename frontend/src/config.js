// Adresse du serveur backend.
// En local : http://localhost:5000 (valeur par défaut).
// En production : définir VITE_API_URL dans le fichier .env (ex. https://api.monsite.com),
// ou VITE_API_URL=/ quand l'API est servie sur la même origine que le site (Docker : nginx
// relaie /api, /uploads et /socket.io vers le backend) → adresses relatives.
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
