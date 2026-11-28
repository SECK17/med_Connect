import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar, FileText, Stethoscope, Bell, ChevronRight,
  Droplets, Users, Plus, FolderOpen, ChevronDown,
  Pill, Sparkles, Activity, Download, Heart, Shield,
} from "lucide-react";
import { API_URL } from "../../../config.js";

const STATS = [
  { key: "rdv",      label: "Rendez-vous", icon: Calendar,    bg: "bg-emerald-50", border: "border-emerald-100", ico: "bg-emerald-100 text-emerald-600", num: "text-emerald-700", to: "rendezvous", state: {} },
  { key: "docs",     label: "Ordonnances", icon: FileText,    bg: "bg-indigo-50",  border: "border-indigo-100",  ico: "bg-indigo-100 text-indigo-600",   num: "text-indigo-700",  to: "dossier",    state: { tab: "ordonnances" } },
  { key: "medecins", label: "Médecins",    icon: Stethoscope, bg: "bg-amber-50",   border: "border-amber-100",   ico: "bg-amber-100 text-amber-600",     num: "text-amber-700",   to: "medecins",   state: {} },
  { key: "alertes",  label: "Alertes",     icon: Bell,        bg: "bg-rose-50",    border: "border-rose-100",    ico: "bg-rose-100 text-rose-500",       num: "text-rose-600",    to: "alertes",    state: {} },
];

const ACTIONS = [
  { label: "Nouveau RDV",  icon: Plus,        to: "rendezvous", state: {}, ico: "bg-emerald-100 text-emerald-600" },
  { label: "Dossier",      icon: FolderOpen,  to: "dossier",    state: {}, ico: "bg-indigo-100 text-indigo-600"  },
  { label: "Médecins",     icon: Stethoscope, to: "medecins",   state: {}, ico: "bg-amber-100 text-amber-600"   },
  { label: "Don de sang",  icon: Droplets,    to: "sang",       state: {}, ico: "bg-rose-100 text-rose-500"     },
];

export default function Accueil() {
  const navigate = useNavigate();
  const nom      = sessionStorage.getItem("nom") || "Patient";
  const heure    = new Date().getHours();
  const salut    = heure < 6 ? "Bonne nuit" : heure < 12 ? "Bonjour" : heure < 18 ? "Bon après-midi" : "Bonsoir";
  const initiales = nom.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const dateStr   = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const [appointments, setAppointments]   = useState(() => JSON.parse(localStorage.getItem("medconnect_appointments") || "[]"));
  const [prescriptions, setPrescriptions] = useState([]);
  const [notifications] = useState(() => JSON.parse(localStorage.getItem("medconnect_notifications") || "[]"));
  const [donorCount, setDonorCount]       = useState(null);
  const [loading, setLoading]             = useState(() => Boolean(sessionStorage.getItem("token") && sessionStorage.getItem("userId"))); // rien à charger si personne n'est connecté
  const [openOrd, setOpenOrd]             = useState(null);

  useEffect(() => {
    const token  = sessionStorage.getItem("token");
    const userId = sessionStorage.getItem("userId");

    if (token && userId) {
      fetch(`${API_URL}/api/rendezvous/patient/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          const mapped = data.map(r => ({
            id: String(r.id),
            doctorId: String(r.medecin_id),
            doctorName: r.medecin?.user?.nom || "Médecin",
            specialty: r.medecin?.specialite || "Généraliste",
            date: r.date_rdv?.split("T")[0] || "",
            time: r.heure || "",
            status: r.statut === "confirme" ? "Confirmé" : r.statut === "annule" ? "Annulé" : "En attente",
          }));
          localStorage.setItem("medconnect_appointments", JSON.stringify(mapped));
          setAppointments(mapped);
        })
        .catch(() => {})
        .finally(() => setLoading(false));

      fetch(`${API_URL}/api/ordonnances/patient/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : [])
        .then(setPrescriptions)
        .catch(() => {});

      fetch(`${API_URL}/api/donneur/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.stats?.donorCount != null) setDonorCount(d.stats.donorCount); })
        .catch(() => {});
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const stats = [
    appointments.length,
    prescriptions.length,
    [...new Set(appointments.map(a => a.doctorId))].length,
    unreadCount,
  ];

  const profil      = JSON.parse(localStorage.getItem("medconnect_profile") || "{}");
  const groupe      = profil.bloodGroup || profil.groupeSanguin || "Non renseigné";
  const allergies   = Array.isArray(profil.allergies)   ? profil.allergies   : [];
  const antecedents = Array.isArray(profil.antecedents) ? profil.antecedents : [];

  const downloadCarteMedicale = () => {
    const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const meds = prescriptions.slice(0, 5).flatMap(p =>
      (Array.isArray(p.medicaments) ? p.medicaments : (p.drugs || []))
        .map(m => m.nom || m.name).filter(Boolean)
    );
    const content = [
      "╔══════════════════════════════════════╗",
      "║         CARTE MÉDICALE               ║",
      "║            MedConnect                ║",
      "╚══════════════════════════════════════╝",
      "",
      `Patient      : ${nom}`,
      `Généré le    : ${date}`,
      "",
      "────────── DONNÉES DE SANTÉ ───────────",
      `Groupe sanguin   : ${groupe}`,
      `Allergies        : ${allergies.length > 0 ? allergies.join(", ") : "Aucune"}`,
      `Antécédents      : ${antecedents.length > 0 ? antecedents.join(", ") : "Aucun"}`,
      `Traitements      : ${meds.length > 0 ? meds.join(", ") : "Aucun en cours"}`,
      "",
      "───────────────────────────────────────",
      "Document confidentiel — MedConnect",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href  = url;
    link.download = `carte-medicale-${nom.toLowerCase().replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 pb-6">

      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-6 text-white shadow-xl shadow-blue-300"
      >
        {/* Déco */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute top-6 right-14 w-12 h-12 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 right-4 w-28 h-28 rounded-full bg-teal-400/30" />

        <div className="relative flex items-start gap-4">
          {/* Avatar initiales */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white font-extrabold text-xl flex-shrink-0 shadow-lg"
          >
            {initiales}
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={13} className="text-yellow-300" />
              <span className="text-white/75 text-[12px] font-medium">{salut}</span>
            </div>
            <h1 className="text-[22px] font-extrabold leading-tight truncate tracking-tight">
              {nom.split(" ")[0]}
            </h1>
            <p className="text-white/60 text-[11px] mt-1 capitalize">{dateStr}</p>
          </div>

          {/* Bell */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("../alertes", { relative: "path" })}
            className="relative w-11 h-11 rounded-2xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0 border border-white/20"
          >
            <Bell size={18} className="text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center px-1 shadow">
                {unreadCount}
              </span>
            )}
          </motion.button>
        </div>

        {/* Résumé santé */}
        <div className="relative mt-5 flex items-center gap-2 bg-white/15 border border-white/20 rounded-2xl px-4 py-3">
          <Activity size={15} className="text-white/70 flex-shrink-0" />
          <span className="text-white/80 text-[12px]">
            {loading ? "Chargement de vos données..." :
              appointments.length > 0
                ? `${appointments.length} rendez-vous · ${prescriptions.length} ordonnance(s)`
                : "Bienvenue sur votre espace santé"}
          </span>
        </div>
      </motion.div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(({ key, label, icon: Icon, bg, border, ico, num, to, state: navState }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 + i * 0.08 }}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`../${to}`, { state: navState, relative: "path" })}
            className={`relative ${bg} border ${border} rounded-2xl p-4 cursor-pointer shadow-sm hover:shadow-md transition-all select-none`}
          >
            <div className={`w-9 h-9 rounded-xl ${ico} flex items-center justify-center mb-3`}>
              <Icon size={16} />
            </div>
            <div className={`text-[30px] font-extrabold leading-none mb-1 tracking-tight ${num}`}>
              {loading ? <span className="text-gray-300 text-2xl">·</span> : stats[i]}
            </div>
            <div className="text-[11px] text-gray-500 font-medium">{label}</div>
            <div className="absolute bottom-3 right-3">
              <ChevronRight size={13} className="text-gray-300" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── ACTIONS RAPIDES ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
      >
        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Actions rapides</p>
        <div className="grid grid-cols-4 gap-3">
          {ACTIONS.map(({ label, icon: Icon, to, state: navState, ico }, i) => (
            <motion.button
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => navigate(`../${to}`, { state: navState, relative: "path" })}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className={`w-11 h-11 rounded-xl ${ico} flex items-center justify-center`}>
                <Icon size={17} />
              </div>
              <span className="text-[10px] font-semibold text-gray-500 text-center leading-tight px-1">{label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── CARTE MÉDICALE ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34 }}
        className="bg-white border border-blue-100 rounded-2xl overflow-hidden shadow-sm"
      >
        {/* Header gradient */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-700 to-blue-500">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Heart size={15} className="text-white" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-white">Carte médicale</div>
              <div className="text-white/60 text-[10px]">Votre résumé santé</div>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={downloadCarteMedicale}
            className="flex items-center gap-1.5 text-[12px] text-white font-semibold bg-white/20 hover:bg-white/30 border border-white/30 px-3 py-2 rounded-xl transition-colors"
          >
            <Download size={13} /> Télécharger
          </motion.button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {/* Groupe sanguin */}
          <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
              <Droplets size={16} className="text-rose-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Groupe sanguin</div>
              <div className={`text-[22px] font-extrabold leading-none mt-0.5 ${groupe !== "Non renseigné" ? "text-rose-600" : "text-gray-300"}`}>
                {groupe}
              </div>
            </div>
            {groupe === "O-"  && <span className="text-[9px] bg-rose-100 text-rose-600 font-bold px-2 py-0.5 rounded-full border border-rose-200 flex-shrink-0">Donneur universel</span>}
            {groupe === "AB+" && <span className="text-[9px] bg-rose-100 text-rose-600 font-bold px-2 py-0.5 rounded-full border border-rose-200 flex-shrink-0">Receveur universel</span>}
          </div>

          {/* Allergies */}
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <div className="flex items-center gap-1.5 mb-2">
              <Shield size={12} className="text-amber-500" />
              <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Allergies</span>
            </div>
            {allergies.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {allergies.map((al, idx) => (
                  <span key={idx} className="text-[11px] bg-amber-100 text-amber-700 border border-amber-200 font-medium px-2 py-0.5 rounded-full">{al}</span>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-gray-400">Aucune allergie renseignée</p>
            )}
          </div>

          {/* Antécédents */}
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="flex items-center gap-1.5 mb-2">
              <Activity size={12} className="text-blue-500" />
              <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Antécédents</span>
            </div>
            {antecedents.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {antecedents.map((ant, idx) => (
                  <span key={idx} className="text-[11px] bg-blue-100 text-blue-700 border border-blue-200 font-medium px-2 py-0.5 rounded-full">{ant}</span>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-gray-400">Aucun antécédent renseigné</p>
            )}
          </div>

          <button
            onClick={() => navigate("../profil", { relative: "path" })}
            className="w-full text-[12px] text-blue-600 hover:text-blue-800 font-semibold text-center py-2 hover:bg-blue-50 rounded-xl transition-colors"
          >
            Compléter mon profil médical →
          </button>
        </div>
      </motion.div>

      {/* ── ORDONNANCES RÉCENTES ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36 }}
        className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-sm shadow-violet-200">
              <FileText size={14} className="text-white" />
            </div>
            <span className="text-[14px] font-bold text-gray-900">Ordonnances récentes</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("../dossier", { relative: "path" })}
            className="flex items-center gap-1 text-[12px] text-blue-600 hover:text-blue-800 font-semibold transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full"
          >
            Voir tout <ChevronRight size={12} />
          </motion.button>
        </div>

        <div className="border-t border-gray-50">
          {prescriptions.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <FileText size={22} className="text-gray-200" />
              </div>
              <p className="text-[13px] text-gray-400 font-medium">Aucune ordonnance</p>
              <p className="text-[11px] text-gray-300 mt-1">Vos ordonnances apparaîtront ici</p>
            </div>
          ) : (
            prescriptions.slice(0, 3).map((p) => {
              const nomMedecin = p.medecin?.user?.nom || p.doctorName || "Médecin";
              const meds = Array.isArray(p.medicaments) ? p.medicaments : (p.drugs || []);
              const dateAff = p.date || "";
              const isOpen = openOrd === p.id;
              return (
                <div key={p.id} className="border-b border-gray-50 last:border-0">
                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                    onClick={() => setOpenOrd(isOpen ? null : p.id)}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-400 flex items-center justify-center flex-shrink-0 shadow-sm shadow-violet-200">
                      <span className="text-white font-bold text-[13px]">{nomMedecin[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-gray-900">Dr. {nomMedecin}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {meds.length} médicament(s)
                        {dateAff && ` · ${new Date(dateAff).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isOpen ? "bg-violet-100" : "bg-gray-100"}`}
                    >
                      <ChevronDown size={13} className={isOpen ? "text-violet-600" : "text-gray-400"} />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 space-y-2">
                          {meds.map((m, i) => (
                            <div key={i} className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5">
                              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                                <Pill size={13} className="text-violet-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-bold text-gray-800">{m.nom || m.name || "—"}</div>
                                {(m.dosage || m.duree || m.duration) && (
                                  <div className="text-[11px] text-gray-500">{m.dosage}{(m.duree || m.duration) ? ` · ${m.duree || m.duration}` : ""}</div>
                                )}
                              </div>
                            </div>
                          ))}
                          {p.notes && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-[12px] text-amber-800 font-medium">
                              Note : {p.notes}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* ── DON DE SANG ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42 }}
        className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
              <Droplets size={15} className="text-rose-500" />
            </div>
            <span className="text-[14px] font-bold text-gray-800">Don de sang</span>
          </div>
          <button
            onClick={() => navigate("../sang", { relative: "path" })}
            className="text-[12px] text-rose-400 hover:text-rose-600 font-semibold flex items-center gap-1 transition-colors"
          >
            Voir tout <ChevronRight size={12} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 bg-rose-50 border border-rose-100 rounded-2xl px-5 py-3 text-center">
            <div className="text-3xl font-extrabold text-rose-500 leading-none">{donorCount ?? "..."}</div>
            <div className="flex items-center justify-center gap-1 mt-1 text-rose-400 text-[10px]">
              <Users size={10} /> donneurs
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[12px] text-gray-500 leading-relaxed mb-3">
              Rejoignez la communauté et sauvez des vies au Sénégal.
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("../sang", { relative: "path" })}
              className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[12px] px-4 py-2 rounded-xl border border-rose-200 transition-colors"
            >
              <Droplets size={13} /> Devenir donneur
            </motion.button>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
