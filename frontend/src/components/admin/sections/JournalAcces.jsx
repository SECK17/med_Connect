// Section « Journal d'accès » : qui a consulté ou modifié quel dossier médical, et quand.
// Filtres (patient, auteur, action, partie du dossier, résultat, période) et pagination.
import { motion } from "motion/react";
import { ShieldCheck, ShieldAlert, ChevronLeft, ChevronRight, RotateCcw, Loader2 } from "lucide-react";
import { ROLE_CFG } from "../constantes.js";
import { FILTRES_VIDES } from "../hooks/useJournal.js";

const ACTIONS = {
  lecture: "Consultation", creation: "Création", modification: "Modification",
  suppression: "Suppression", telechargement: "Ouverture de fichier",
};
const RESSOURCES = {
  profil: "Profil médical", rendezvous: "Rendez-vous", ordonnances: "Ordonnances", analyses: "Analyses",
  consultations: "Consultations", partages: "Partages", fichier: "Fichier",
};

const formatDateHeure = (d) => new Date(d).toLocaleString("fr-FR", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
});

const CHAMP = "h-9 px-2.5 bg-white border border-gray-200 rounded-lg text-[12.5px] text-gray-700 focus:outline-none focus:border-indigo-400";

export default function JournalAcces({
  users, filtres, changerFiltre, reinitialiserFiltres, page, setPage,
  entreesJournal, totalJournal, pagesJournal, erreurJournal, chargementJournal,
}) {
  const nomDe = (id) => users.find((u) => u.id === id)?.nom;
  const patients = users.filter((u) => u.role === "patient" || u.role === "donneur");
  const filtreActif = JSON.stringify(filtres) !== JSON.stringify(FILTRES_VIDES);
  const refusesSeulement = filtres.autorise === "false";

  return (
    <motion.div key="journal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

      {/* En-tête */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-indigo-950 tracking-tight flex items-center gap-2">
            <ShieldCheck size={18} className="text-indigo-600" /> Journal d'accès aux dossiers
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Chaque consultation, ajout, modification ou téléchargement dans un dossier médical, y compris les tentatives refusées.
          </p>
        </div>
        <button
          onClick={() => changerFiltre("autorise", refusesSeulement ? "" : "false")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-semibold border transition-colors ${
            refusesSeulement ? "bg-red-600 border-red-600 text-white" : "bg-white border-red-200 text-red-600 hover:bg-red-50"
          }`}
        >
          <ShieldAlert size={14} /> Accès refusés seulement
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Patient</span>
          <select className={CHAMP} value={filtres.patient_id} onChange={(e) => changerFiltre("patient_id", e.target.value)}>
            <option value="">Tous</option>
            {patients.map((u) => <option key={u.id} value={u.id}>{u.nom}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Auteur de l'accès</span>
          <select className={CHAMP} value={filtres.acteur_id} onChange={(e) => changerFiltre("acteur_id", e.target.value)}>
            <option value="">Tous</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.nom} ({ROLE_CFG[u.role]?.label || u.role})</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Action</span>
          <select className={CHAMP} value={filtres.action} onChange={(e) => changerFiltre("action", e.target.value)}>
            <option value="">Toutes</option>
            {Object.entries(ACTIONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Partie du dossier</span>
          <select className={CHAMP} value={filtres.ressource} onChange={(e) => changerFiltre("ressource", e.target.value)}>
            <option value="">Toutes</option>
            {Object.entries(RESSOURCES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Résultat</span>
          <select className={CHAMP} value={filtres.autorise} onChange={(e) => changerFiltre("autorise", e.target.value)}>
            <option value="">Tous</option>
            <option value="true">Autorisé</option>
            <option value="false">Refusé</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Du</span>
          <input type="date" className={CHAMP} value={filtres.du} max={filtres.au || undefined}
            onChange={(e) => changerFiltre("du", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Au</span>
          <input type="date" className={CHAMP} value={filtres.au} min={filtres.du || undefined}
            onChange={(e) => changerFiltre("au", e.target.value)} />
        </label>
        {filtreActif && (
          <button onClick={reinitialiserFiltres}
            className="h-9 px-3 flex items-center gap-1.5 text-[12.5px] font-medium text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors">
            <RotateCcw size={13} /> Réinitialiser
          </button>
        )}
      </div>

      {/* Tableau */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-gray-700">
            {chargementJournal ? "Chargement…" : `${totalJournal} entrée${totalJournal > 1 ? "s" : ""}`}
          </span>
          {chargementJournal && <Loader2 size={15} className="animate-spin text-indigo-500" />}
        </div>

        {erreurJournal && (
          <div className="px-5 py-4 text-[13px] text-red-700 bg-red-50">{erreurJournal}</div>
        )}

        {!chargementJournal && !erreurJournal && entreesJournal.length === 0 && (
          <div className="px-5 py-12 text-center text-[13px] text-gray-400">
            {filtreActif ? "Aucun accès ne correspond à ces filtres." : "Aucun accès enregistré pour le moment."}
          </div>
        )}

        {entreesJournal.length > 0 && (
          <div className="overflow-x-auto">
            <table className={`w-full text-[12.5px] ${chargementJournal ? "opacity-50" : ""}`}>
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 bg-gray-50">
                  <th className="px-5 py-2.5 font-semibold">Date</th>
                  <th className="px-3 py-2.5 font-semibold">Auteur</th>
                  <th className="px-3 py-2.5 font-semibold">Action</th>
                  <th className="px-3 py-2.5 font-semibold">Patient</th>
                  <th className="px-3 py-2.5 font-semibold">Résultat</th>
                  <th className="px-5 py-2.5 font-semibold">Origine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entreesJournal.map((e) => {
                  const role = ROLE_CFG[e.acteur_role];
                  const patient = e.patient_id ? (nomDe(e.patient_id) || `Patient #${e.patient_id}`) : "—";
                  return (
                    <tr key={e.id} className={e.autorise ? "" : "bg-red-50/50"}>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDateHeure(e.created_at)}</td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-gray-900">{e.acteur_nom || `Utilisateur #${e.acteur_id}`}</div>
                        <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${role ? `${role.bg} ${role.text}` : "bg-gray-100 text-gray-600"}`}>
                          {role?.label || e.acteur_role}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-gray-900">{ACTIONS[e.action] || e.action}</div>
                        <div className="text-gray-400">
                          {RESSOURCES[e.ressource] || e.ressource}
                          {e.details ? ` · ${e.details}` : ""}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        {e.patient_id ? (
                          <button onClick={() => changerFiltre("patient_id", String(e.patient_id))}
                            className="hover:text-indigo-700 hover:underline" title="Voir tous les accès à ce dossier">
                            {patient}
                          </button>
                        ) : patient}
                      </td>
                      <td className="px-3 py-3">
                        {e.autorise ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Autorisé</span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Refusé</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-400 max-w-[220px]">
                        <div className="font-mono text-[11.5px] text-gray-600">{e.ip || "—"}</div>
                        <div className="truncate" title={e.user_agent || ""}>{e.user_agent || ""}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagesJournal > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[12px] text-gray-500">Page {page} sur {pagesJournal}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1 || chargementJournal}
                className="h-8 px-3 flex items-center gap-1 text-[12.5px] font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft size={14} /> Précédent
              </button>
              <button onClick={() => setPage(page + 1)} disabled={page >= pagesJournal || chargementJournal}
                className="h-8 px-3 flex items-center gap-1 text-[12.5px] font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
