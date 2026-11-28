// Bandeau d'erreur commun à toute l'application (voir utils/erreurs.js).
// Plusieurs erreurs rapprochées (ex. tous les appels d'une page en panne) n'affichent qu'un bandeau.
import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { EVENEMENT_ERREUR } from "../utils/erreurs.js";

const DUREE_MS = 8000;

export default function BandeauErreur() {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let minuteur;
    const afficher = (e) => {
      setMessage(e.detail?.message || "Une erreur est survenue.");
      clearTimeout(minuteur);
      minuteur = setTimeout(() => setMessage(null), DUREE_MS);
    };
    window.addEventListener(EVENEMENT_ERREUR, afficher);
    return () => { window.removeEventListener(EVENEMENT_ERREUR, afficher); clearTimeout(minuteur); };
  }, []);

  if (!message) return null;
  return (
    <div role="alert"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] max-w-[calc(100vw-2rem)] flex items-center gap-3 bg-red-600 text-white text-[13px] font-medium pl-4 pr-2 py-3 rounded-xl shadow-xl">
      <AlertTriangle size={16} className="flex-shrink-0" />
      <span>{message}</span>
      <button onClick={() => setMessage(null)} aria-label="Fermer"
        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/20 flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}
