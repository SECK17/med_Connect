# MedConnect — frontend

Application React (Vite + Tailwind CSS). L'installation, la configuration et le lancement
sont décrits dans le [README principal](../README.md).

```bash
cp .env.example .env   # VITE_API_URL=http://localhost:5000
npm install
npm run dev            # http://localhost:5173
```

- `src/config.js` : adresse de l'API (`VITE_API_URL`, ou `/` pour la même origine, comme dans Docker)
- `src/auth.js` : session (renouvellement automatique du jeton, déconnexion)
- `src/components/<rôle>/` : un espace par rôle (patient, medecin, donneur, adminHopital, admin)
