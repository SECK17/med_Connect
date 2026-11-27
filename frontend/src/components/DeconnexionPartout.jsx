// « Déconnecter tous mes appareils » : coupe toutes les sessions du compte (téléphone, autre
// ordinateur, onglet oublié…), y compris celle-ci, puis renvoie vers la page de connexion.
// Utile après une connexion sur un appareil partagé ou en cas de doute sur la sécurité du compte.
import { useState } from "react";
import { ShieldAlert, LogOut, Loader2 } from "lucide-react";
import useDeconnexionPartout from "../hooks/useDeconnexionPartout.js";

/** Carte « Appareils connectés » pour les pages de profil, avec confirmation. */
export default function DeconnexionPartout() {
  const [confirmer, setConfirmer] = useState(false);
  const { enCours, deconnecterPartout } = useDeconnexionPartout();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
          <ShieldAlert size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-gray-900">Appareils connectés</h3>
          <p className="text-[12.5px] text-gray-500 mt-0.5 leading-relaxed">
            Vous vous êtes connecté sur un appareil partagé, ou vous pensez que quelqu'un d'autre utilise votre compte ?
            Déconnectez toutes les sessions ouvertes, y compris celle-ci.
          </p>

          {!confirmer ? (
            <button
              onClick={() => setConfirmer(true)}
              className="mt-3 inline-flex items-center gap-2 text-[13px] font-semibold text-red-600 border border-red-200 hover:bg-red-50 px-3.5 py-2 rounded-xl transition-colors"
            >
              <LogOut size={14} /> Déconnecter tous mes appareils
            </button>
          ) : (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-[12.5px] text-red-800 font-medium">
                Toutes vos sessions seront fermées, et vous devrez vous reconnecter ici aussi. Continuer ?
              </p>
              <div className="flex gap-2 mt-2.5">
                <button
                  onClick={deconnecterPartout}
                  disabled={enCours}
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 px-3.5 py-2 rounded-xl transition-colors"
                >
                  {enCours ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                  Oui, tout déconnecter
                </button>
                <button
                  onClick={() => setConfirmer(false)}
                  disabled={enCours}
                  className="text-[13px] font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-3.5 py-2 rounded-xl transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
