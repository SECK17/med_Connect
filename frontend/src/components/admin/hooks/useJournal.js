// Journal des accès aux dossiers médicaux (GET /api/journal) : filtres et pagination.
// Les données ne sont chargées que lorsque la section est affichée (actif = true).
import { useEffect, useState } from "react";
import { API_URL } from "../../../config.js";

export const PAR_PAGE = 25;
export const FILTRES_VIDES = { patient_id: "", acteur_id: "", action: "", ressource: "", autorise: "", du: "", au: "" };

async function recuperer(token, filtres, page) {
  const params = new URLSearchParams({ page: String(page), limit: String(PAR_PAGE) });
  for (const [cle, valeur] of Object.entries(filtres)) if (valeur !== "") params.set(cle, valeur);
  const res = await fetch(`${API_URL}/api/journal?${params}`, { headers: { Authorization: `Bearer ${token}` } });
  const corps = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(corps.message || "Impossible de charger le journal.");
  return {
    entrees: corps,
    total: parseInt(res.headers.get("X-Total-Count"), 10) || 0,
    pages: parseInt(res.headers.get("X-Total-Pages"), 10) || 1,
  };
}

export default function useJournal({ token, actif }) {
  const [filtres, setFiltres] = useState(FILTRES_VIDES);
  const [page, setPage] = useState(1);
  // Dernier résultat reçu, associé à la requête qui l'a produit
  const [resultat, setResultat] = useState({ cle: null, entrees: [], total: 0, pages: 1, erreur: "" });

  const cle = JSON.stringify({ filtres, page });
  const chargement = actif && resultat.cle !== cle;

  useEffect(() => {
    if (!actif) return undefined;
    let annule = false;
    recuperer(token, filtres, page).then(
      (r) => { if (!annule) setResultat({ cle: JSON.stringify({ filtres, page }), ...r, erreur: "" }); },
      (e) => { if (!annule) setResultat({ cle: JSON.stringify({ filtres, page }), entrees: [], total: 0, pages: 1, erreur: e.message }); },
    );
    return () => { annule = true; };
  }, [actif, token, filtres, page]);

  /** Change un filtre et revient à la première page. */
  const changerFiltre = (nom, valeur) => {
    setFiltres((f) => ({ ...f, [nom]: valeur }));
    setPage(1);
  };
  const reinitialiserFiltres = () => { setFiltres(FILTRES_VIDES); setPage(1); };

  return {
    filtres, changerFiltre, reinitialiserFiltres,
    page, setPage,
    entreesJournal: resultat.entrees,
    totalJournal: resultat.total,
    pagesJournal: resultat.pages,
    erreurJournal: resultat.erreur,
    chargementJournal: chargement,
  };
}
