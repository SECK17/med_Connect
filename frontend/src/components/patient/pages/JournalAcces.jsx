// Page « Qui a accédé à mon dossier ? » — espaces patient et donneur.
// Affiche le journal d'accès (GET /api/journal/patient/:id), page par page.
import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  ShieldCheck, ShieldAlert, Eye, FilePlus2, Pencil, Trash2, Download, Share2,
} from "lucide-react";
import { API_URL } from "../../../config.js";

const PAR_PAGE = 20;

// Couleurs de l'espace : bleu (patient) ou rouge (donneur). Pour le donneur, les accès autorisés
// restent neutres, afin que les accès refusés (en rouge) ressortent toujours.
const THEMES = {
  patient: {
    titre: "text-blue-600",
    filtreActif: "bg-blue-50 border-blue-500 text-blue-700 font-medium",
    bordure: "border-l-blue-400",
    icone: "bg-blue-50 text-blue-600",
    pastille: "bg-blue-50 text-blue-700",
    bouton: "text-blue-600 border-blue-200 hover:bg-blue-50",
  },
  donneur: {
    titre: "text-red-500",
    filtreActif: "bg-red-50 border-red-500 text-red-700 font-medium",
    bordure: "border-l-slate-300",
    icone: "bg-slate-100 text-slate-600",
    pastille: "bg-slate-100 text-slate-700",
    bouton: "text-red-600 border-red-200 hover:bg-red-50",
  },
};

const ROLES = {
  medecin: "Médecin",
  admin: "Administrateur",
  admin_hopital: "Admin hôpital",
  patient: "Patient",
  donneur: "Donneur",
};

// Complément d'objet selon la ressource et l'action
const OBJET = {
  profil:        { lecture: "votre profil médical", modification: "votre profil médical" },
  rendezvous:    { lecture: "vos rendez-vous" },
  ordonnances:   { lecture: "vos ordonnances", creation: "une ordonnance" },
  analyses:      { lecture: "vos analyses", creation: "un résultat d'analyse" },
  consultations: { lecture: "vos consultations", creation: "un compte-rendu de consultation", suppression: "un compte-rendu de consultation" },
  partages:      { lecture: "la liste de vos partages" },
  fichier:       { telechargement: "un document de votre dossier" },
};

const VERBE = {
  lecture: "a consulté", creation: "a ajouté", modification: "a modifié",
  suppression: "a supprimé", telechargement: "a ouvert",
};
const TENTATIVE = {
  lecture: "a tenté de consulter", creation: "a tenté d'ajouter", modification: "a tenté de modifier",
  suppression: "a tenté de supprimer", telechargement: "a tenté d'ouvrir",
};
const ICONE = {
  lecture: Eye, creation: FilePlus2, modification: Pencil, suppression: Trash2, telechargement: Download,
};

const phrase = (e, moi) => {
  const qui = e.acteur_id === moi ? "Vous" : (e.acteur_nom || `Utilisateur #${e.acteur_id}`);
  if (e.ressource === "partages" && e.action !== "lecture" && e.autorise) {
    const medecin = e.details || "un médecin";
    const sujet = qui === "Vous" ? "Vous avez" : `${qui} a`;
    return e.action === "creation"
      ? `${sujet} partagé votre dossier avec ${medecin}`
      : `${sujet} retiré l'accès de ${medecin} à votre dossier`;
  }
  const objet = OBJET[e.ressource]?.[e.action] || "votre dossier";
  return `${qui} ${(e.autorise ? VERBE : TENTATIVE)[e.action] || "a accédé à"} ${objet}`;
};

// Regroupe les accès successifs identiques (même personne, même action, même partie
// du dossier, à moins de 15 min d'écart) : ouvrir un dossier déclenche plusieurs lectures.
const ECART_GROUPE_MS = 15 * 60 * 1000;
const regrouper = (liste) => liste.reduce((groupes, e) => {
  const g = groupes[groupes.length - 1];
  const memeAcces = g && g.acteur_id === e.acteur_id && g.action === e.action
    && g.ressource === e.ressource && g.autorise === e.autorise && g.details === e.details
    && new Date(g.plusAncien) - new Date(e.created_at) < ECART_GROUPE_MS;
  if (memeAcces) {
    g.nb += 1;
    g.plusAncien = e.created_at;
  } else {
    groupes.push({ ...e, nb: 1, plusAncien: e.created_at });
  }
  return groupes;
}, []);

const formatDate = (d) => new Date(d).toLocaleString("fr-FR", {
  day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
});

async function recupererPage(userId, p) {
  const res = await fetch(`${API_URL}/api/journal/patient/${userId}?page=${p}&limit=${PAR_PAGE}`, {
    headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Erreur de chargement.");
  const data = await res.json();
  return {
    p,
    data,
    pages: parseInt(res.headers.get("X-Total-Pages"), 10) || 1,
    total: parseInt(res.headers.get("X-Total-Count"), 10) || data.length,
  };
}

const formatHeure = (d) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const formatJour = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

// « 27 novembre 2026 à 13:48 », « 27 novembre 2026, de 13:48 à 13:59 », ou deux dates complètes
const formatPeriode = (debut, fin) => {
  if (formatDate(debut) === formatDate(fin)) return formatDate(fin);
  if (formatJour(debut) === formatJour(fin)) return `${formatJour(fin)}, de ${formatHeure(debut)} à ${formatHeure(fin)}`;
  return `Du ${formatDate(debut)} au ${formatDate(fin)}`;
};

export default function JournalAcces() {
  const [entrees, setEntrees] = useState([]);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur]   = useState("");
  const [filtre, setFiltre]   = useState("tous");

  const userId = parseInt(sessionStorage.getItem("userId"), 10);
  const theme = THEMES[sessionStorage.getItem("role")] || THEMES.patient;

  // Mise à jour de l'état après réception d'une page (jamais appelée de façon synchrone)
  const appliquer = useCallback(({ p, data, pages: nbPages, total: nb }) => {
    setEntrees(prev => (p === 1 ? data : [...prev, ...data]));
    setPages(nbPages);
    setTotal(nb);
    setPage(p);
    setLoading(false);
  }, []);
  const echec = useCallback((e) => { setErreur(e.message); setLoading(false); }, []);

  useEffect(() => {
    recupererPage(userId, 1).then(appliquer, echec);
  }, [userId, appliquer, echec]);

  const plusAnciens = () => {
    setLoading(true);
    setErreur("");
    recupererPage(userId, page + 1).then(appliquer, echec);
  };

  const affichees = regrouper(filtre === "refuses" ? entrees.filter(e => !e.autorise) : entrees);
  const nbRefus = entrees.filter(e => !e.autorise).length;

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <ShieldCheck size={20} className={theme.titre} /> Accès à mon dossier
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Chaque consultation de votre dossier médical par un soignant ou un administrateur est enregistrée ici.
          Les accès que vous faites vous-même n'y figurent pas.
        </p>
      </motion.div>

      <div className="flex flex-wrap gap-2">
        {[["tous", `Tous (${total})`], ["refuses", `Accès refusés${nbRefus ? ` (${nbRefus})` : ""}`]].map(([cle, label]) => (
          <button
            key={cle}
            onClick={() => setFiltre(cle)}
            className={`text-[12px] px-3 py-1 rounded-full border transition-colors ${
              filtre === cle
                ? theme.filtreActif
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {erreur && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{erreur}</div>
      )}

      <div className="space-y-2">
        {!loading && !erreur && affichees.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl py-10 text-center text-sm text-gray-400">
            {filtre === "refuses" ? "Aucune tentative d'accès refusée." : "Personne n'a encore accédé à votre dossier."}
          </div>
        )}

        {affichees.map(e => {
          const Icone = e.autorise ? (e.ressource === "partages" ? Share2 : ICONE[e.action] || Eye) : ShieldAlert;
          return (
            <div
              key={e.id}
              className={`bg-white border border-gray-200 border-l-4 rounded-xl p-4 flex items-start gap-3 ${
                e.autorise ? theme.bordure : "border-l-red-400"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                e.autorise ? theme.icone : "bg-red-50 text-red-600"
              }`}>
                <Icone size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold text-gray-900">{phrase(e, userId)}</span>
                  {e.acteur_id !== userId && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {ROLES[e.acteur_role] || e.acteur_role}
                    </span>
                  )}
                  {e.nb > 1 && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${theme.pastille}`}>
                      {e.nb} fois
                    </span>
                  )}
                  {!e.autorise && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      Accès refusé
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  {formatPeriode(e.plusAncien, e.created_at)}
                </div>
              </div>
            </div>
          );
        })}

        {loading && <div className="py-6 text-center text-sm text-gray-400">Chargement…</div>}

        {!loading && page < pages && (
          <button
            onClick={plusAnciens}
            className={`w-full text-[13px] border py-2 rounded-xl transition-colors ${theme.bouton}`}
          >
            Afficher les accès plus anciens
          </button>
        )}
      </div>
    </div>
  );
}
