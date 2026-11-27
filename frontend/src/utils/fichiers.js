// Fichiers médicaux (ordonnances, analyses) : adresse, type, date, téléchargement, impression.
// Utilisé par le dossier médical du patient et par le dossier patient côté médecin.
import { API_URL } from "../config.js";

const jeton = () => sessionStorage.getItem("token");

/** Adresse d'un fichier protégé : le jeton est passé dans l'URL (<img src>, window.open). */
export const fileUrl = (path) => `${API_URL}/${path}?token=${encodeURIComponent(jeton())}`;

export const isPdf = (path) => path?.toLowerCase().endsWith(".pdf");

export const formatDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** Télécharge le fichier sous `name` ; à défaut, l'ouvre dans un nouvel onglet. */
export const handleDownload = async (path, name) => {
  try {
    const res  = await fetch(fileUrl(path), { headers: { Authorization: `Bearer ${jeton()}` } });
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = name || "document";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    window.open(fileUrl(path), "_blank");
  }
};

export const handlePrint = (path) => {
  const win = window.open(fileUrl(path), "_blank");
  win?.addEventListener("load", () => win.print());
};
