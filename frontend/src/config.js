// Adresse du serveur backend.
// En local : http://localhost:5000 (valeur par défaut).
// En production : définir VITE_API_URL dans le fichier .env (ex. https://api.monsite.com).
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
