import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { Heart, LogOut, ShieldCheck, ShieldAlert, AlertCircle } from "lucide-react";

import { deconnexion } from "../../auth.js";
import useDeconnexionPartout from "../../hooks/useDeconnexionPartout.js";
import { NAV, DAYS_FR, MONTHS_FR } from "./constantes.js";
import useToast from "./hooks/useToast";
import useUtilisateurs from "./hooks/useUtilisateurs";
import useHopitaux from "./hooks/useHopitaux";
import useAlertesSang from "./hooks/useAlertesSang";
import useDemandes from "./hooks/useDemandes";
import useJournal from "./hooks/useJournal";
import VueEnsemble from "./sections/VueEnsemble";
import Utilisateurs from "./sections/Utilisateurs";
import Validations from "./sections/Validations";
import Hopitaux from "./sections/Hopitaux";
import DonSang from "./sections/DonSang";
import Demandes from "./sections/Demandes";
import JournalAcces from "./sections/JournalAcces";
import Toast from "./modales/Toast";
import ModaleHopital from "./modales/ModaleHopital";
import ModaleRejetDemande from "./modales/ModaleRejetDemande";
import ModaleRejetCompte from "./modales/ModaleRejetCompte";
import ModaleSuppressionCompte from "./modales/ModaleSuppressionCompte";

/* ── Composant principal ───────────────────────────────────── */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { enCours: deconnexionEnCours, deconnecterPartout } = useDeconnexionPartout();

  const [section, setSection]         = useState("overview");
  const [time, setTime]               = useState(new Date());

  const token   = sessionStorage.getItem("token");
  const adminNom = sessionStorage.getItem("nom") || "Admin";
  const initiale = adminNom.charAt(0).toUpperCase();
  const etatToast = useToast();
  const { showToast } = etatToast;
  const etatUtilisateurs = useUtilisateurs({ token, showToast });
  const { fetchUsers, stats } = etatUtilisateurs;
  const etatHopitaux = useHopitaux({ token, showToast });
  const { fetchHopitaux, fetchHopitalAdmins, fetchHopitauxRdvStats, hopitaux } = etatHopitaux;
  const etatAlertes = useAlertesSang({ token });
  const { fetchAllAlertes } = etatAlertes;
  const etatDemandes = useDemandes({ token, showToast });
  const { fetchDemandes, demandeFilter, demandes } = etatDemandes;
  // Journal des accès aux dossiers : chargé seulement quand la section est affichée
  const etatJournal = useJournal({ token, actif: section === "journal" });

  /* horloge en temps réel */
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchHopitaux();
    fetchHopitalAdmins();
    fetchHopitauxRdvStats();
  }, []);

  useEffect(() => {
    if (section === "hopitaux") {
      if (hopitaux.length === 0) fetchHopitaux();
      fetchHopitalAdmins();
    }
    if (section === "demandes") fetchDemandes(demandeFilter);
    if (section === "don_sang") fetchAllAlertes();
  }, [section]);

  useEffect(() => {
    if (section === "demandes") fetchDemandes(demandeFilter);
  }, [demandeFilter]);

  /* Horloge formatée */
  const hh = String(time.getHours()).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");
  const ss = String(time.getSeconds()).padStart(2, "0");
  const dateStr = `${DAYS_FR[time.getDay()]} ${time.getDate()} ${MONTHS_FR[time.getMonth()]} ${time.getFullYear()}`;

  /* ── Rendu ── */
  return (
    <div className="flex min-h-screen bg-slate-100 overflow-hidden">

      {/* ══════════════════════════════════════
          SIDEBAR (collapsible via group-hover)
      ══════════════════════════════════════ */}
      <aside className="group fixed top-0 left-0 bottom-0 w-[64px] hover:w-[230px] transition-all duration-300 ease-in-out bg-indigo-950 z-50 shadow-2xl shadow-indigo-950/50 flex flex-col overflow-hidden">

        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-indigo-800/40 flex-shrink-0">
          <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-400/30">
            <Heart size={16} className="text-indigo-950" />
          </div>
          <div className="overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-200 delay-75 whitespace-nowrap">
            <div className="text-[15px] font-extrabold text-white tracking-tight">MedConnect</div>
            <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-widest">Administration</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-hidden">
          <div className="px-2 mb-3 h-4 overflow-hidden">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 whitespace-nowrap">
              Navigation
            </span>
          </div>
          {NAV.map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`relative w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-150 group/btn ${
                section === key
                  ? "bg-violet-600 shadow-lg shadow-violet-900/50"
                  : "hover:bg-indigo-900/60"
              }`}
            >
              {/* Indicateur actif */}
              {section === key && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-400 rounded-full" />
              )}

              <div className={`relative w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                section === key ? "bg-white/20" : "bg-indigo-800/40 group-hover/btn:bg-indigo-700/60"
              }`}>
                <Icon size={16} className={section === key ? "text-white" : "text-indigo-400 group-hover/btn:text-indigo-200"} />
                {badge === true && stats.pendingMedecins > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-indigo-950 group-hover:hidden" />
                )}
                {badge === "demandes" && demandes.filter(d => d.statut === "en_attente").length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-400 rounded-full border-2 border-indigo-950 group-hover:hidden" />
                )}
              </div>

              <div className="flex-1 flex items-center justify-between overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-200 delay-75 whitespace-nowrap">
                <span className={`text-[13px] font-medium ${section === key ? "text-white" : "text-indigo-300"}`}>
                  {label}
                </span>
                {badge === true && stats.pendingMedecins > 0 && (
                  <span className="bg-amber-400 text-indigo-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">
                    {stats.pendingMedecins}
                  </span>
                )}
                {badge === "demandes" && demandes.filter(d => d.statut === "en_attente").length > 0 && (
                  <span className="bg-rose-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">
                    {demandes.filter(d => d.statut === "en_attente").length}
                  </span>
                )}
              </div>
            </button>
          ))}
        </nav>

        {/* Footer admin */}
        <div className="px-2 pb-4 flex-shrink-0 border-t border-indigo-800/40 pt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center text-indigo-950 font-extrabold text-[14px] flex-shrink-0 shadow-md">
              {initiale}
            </div>
            <div className="overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-200 delay-75 whitespace-nowrap flex-1">
              <div className="text-[12px] font-bold text-white truncate">{adminNom}</div>
              <div className="text-[10px] text-amber-400/80 flex items-center gap-1">
                <ShieldCheck size={9} /> Administrateur
              </div>
            </div>
            <button
              onClick={() => {
                if (window.confirm("Déconnecter tous vos appareils ? Toutes vos sessions seront fermées, y compris celle-ci.")) deconnecterPartout();
              }}
              disabled={deconnexionEnCours}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-7 h-7 rounded-lg flex items-center justify-center text-indigo-400 hover:bg-red-500/20 hover:text-red-400"
              title="Déconnecter tous mes appareils"
            >
              <ShieldAlert size={13} />
            </button>
            <button
              onClick={async () => { await deconnexion(); navigate("/login"); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-7 h-7 rounded-lg flex items-center justify-center text-indigo-400 hover:bg-red-500/20 hover:text-red-400"
              title="Déconnexion"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          ZONE PRINCIPALE
      ══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col ml-[64px] min-h-screen">

        {/* Topbar */}
        <header className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm flex-shrink-0">
          {/* Horloge */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="text-[11px] text-gray-400 font-medium">{dateStr}</div>
              <div className="text-[18px] font-bold text-indigo-950 font-mono leading-none tracking-wider">
                {hh}:{mm}
                <span className="text-gray-300">:{ss}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {stats.pendingMedecins > 0 && (
              <button
                onClick={() => setSection("validations")}
                className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[12px] font-semibold px-3 py-1.5 rounded-xl hover:bg-amber-100 transition-colors"
              >
                <AlertCircle size={13} className="text-amber-500" />
                {stats.pendingMedecins} en attente
              </button>
            )}
            <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 pl-2 pr-3 py-1.5 rounded-xl">
              <div className="w-7 h-7 bg-amber-400 rounded-lg flex items-center justify-center text-indigo-950 text-[11px] font-extrabold">
                {initiale}
              </div>
              <div className="hidden sm:block">
                <div className="text-[12px] font-bold text-violet-900 leading-tight">{adminNom}</div>
                <div className="text-[10px] text-violet-500 leading-none">Super Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenu */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">

            {/* ────────────────────────────────
                VUE D'ENSEMBLE
            ──────────────────────────────── */}
            {section === "overview" && (
              <VueEnsemble key="overview" {...etatUtilisateurs} adminNom={adminNom} setSection={setSection} />
            )}

            {/* ────────────────────────────────
                UTILISATEURS
            ──────────────────────────────── */}
            {section === "users" && (
              <Utilisateurs key="users" {...etatUtilisateurs} {...etatHopitaux} />
            )}

            {/* ────────────────────────────────
                VALIDATIONS
            ──────────────────────────────── */}
            {section === "validations" && (
              <Validations key="validations" {...etatUtilisateurs} />
            )}

            {/* ────────────────────────────────
                HÔPITAUX
            ──────────────────────────────── */}
            {section === "hopitaux" && (
              <Hopitaux key="hopitaux" {...etatHopitaux} {...etatUtilisateurs} />
            )}

            {/* ────────────────────────────────
                DON DE SANG GLOBAL
            ──────────────────────────────── */}
            {section === "don_sang" && (
              <DonSang key="don_sang" {...etatAlertes} />
            )}

            {/* ────────────────────────────────
                DEMANDES HÔPITAL
            ──────────────────────────────── */}
            {section === "demandes" && (
              <Demandes key="demandes" {...etatDemandes} />
            )}

            {section === "journal" && (
              <JournalAcces key="journal" {...etatJournal} users={etatUtilisateurs.users} />
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* ══ Toast ══ */}
      <Toast {...etatToast} />

      {/* ══ Modal Hôpital (Créer / Modifier) ══ */}
      <ModaleHopital {...etatHopitaux} />

      {/* ══ Modal Rejeter Demande ══ */}
      <ModaleRejetDemande {...etatDemandes} />

      {/* ══ Modal Rejeter ══ */}
      <ModaleRejetCompte {...etatUtilisateurs} />

      {/* ══ Modal Supprimer ══ */}
      <ModaleSuppressionCompte {...etatUtilisateurs} />
    </div>
  );
}
