// Nombre de messages non lus de l'utilisateur connecté (pastille du menu « Messages »).
import { API_URL } from "../config.js";
import { signalerErreur } from "./erreurs.js";

/** Renvoie le nombre de messages non lus, ou null (pas connecté, erreur). */
export async function compterNonLus() {
  const token = sessionStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/api/messages/unread/count`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const d = await res.json();
    return d.count;
  } catch (err) {
    signalerErreur(err);
    return null;
  }
}
