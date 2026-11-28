import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Plus, Droplets, X, CheckCircle2, Trash2, Loader2, AlertTriangle, Navigation, Users, Phone } from "lucide-react";
import { API_URL } from "../../../config.js";

const GROUPES  = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];
const URGENCES = ["Faible","Moyen","Urgent","Critique"];
const RAYONS   = [
  { val: null, label: "Illimité (toute la ville)" },
  { val: 5,    label: "5 km"  },
  { val: 10,   label: "10 km" },
  { val: 15,   label: "15 km" },
];
const DUREES = [
  { val: null, label: "Illimitée" },
  { val: 24,   label: "24 heures" },
  { val: 48,   label: "48 heures" },
  { val: 72,   label: "72 heures" },
  { val: 168,  label: "1 semaine" },
];

function tempsRestant(expire_at) {
  if (!expire_at) return null;
  const diff = new Date(expire_at) - Date.now();
  if (diff <= 0) return { label: "Expirée", expired: true };
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h >= 24) return { label: `Expire dans ${Math.floor(h / 24)}j ${h % 24}h`, expired: false };
  if (h > 0)   return { label: `Expire dans ${h}h ${m}min`, expired: false };
  return { label: `Expire dans ${m} min`, expired: false };
}

const URGENCE_CFG = {
  Critique: { bg: "bg-red-100",    text: "text-red-700",    border: "border-red-200"    },
  Urgent:   { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  Moyen:    { bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-200"  },
  Faible:   { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200"   },
};
const STATUT_CFG = {
  active:   { bg: "bg-emerald-100", text: "text-emerald-700", label: "Active"   },
  terminee: { bg: "bg-gray-100",    text: "text-gray-500",    label: "Terminée" },
  annulee:  { bg: "bg-red-100",     text: "text-red-600",     label: "Annulée"  },
  expiree:  { bg: "bg-amber-100",   text: "text-amber-700",   label: "Expirée"  },
};

const INPUT = "w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100";

const AlerteSang_COMPAT = {
  'O-':  ['O-'],
  'O+':  ['O-','O+'],
  'A-':  ['O-','A-'],
  'A+':  ['O-','O+','A-','A+'],
  'B-':  ['O-','B-'],
  'B+':  ['O-','O+','B-','B+'],
  'AB-': ['O-','A-','B-','AB-'],
  'AB+': ['O-','O+','A-','A+','B-','B+','AB-','AB+'],
};

export default function AdminHopitalAlertes() {
  const [alertes,       setAlertes]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [gpsStatus,     setGpsStatus]     = useState(null);
  const [reponsesModal, setReponsesModal] = useState(null); // { alerte, list, loading }
 // null | 'loading' | 'ok' | 'denied'
  const [form, setForm] = useState({
    groupe_sang: "O+",
    quantite: "",
    message: "",
    urgence: "Urgent",
    rayon_km: null,
    duree_heures: 72,
    latitude: null,
    longitude: null,
  });

  const token = sessionStorage.getItem("token");
  const api = (url, opts = {}) => {
    const { headers: extra, ...rest } = opts;
    return fetch(API_URL + url, {
      headers: { Authorization: `Bearer ${token}`, ...extra },
      ...rest,
    });
  };

  // recuperer…() fait la requête sans toucher à l'état : utilisable tel quel au montage.
  const recupererAlertes = () => api("/api/alertes-sang/moi").then(r => r.ok ? r.json() : []);
  const load = () => {
    setLoading(true);
    recupererAlertes().then(setAlertes).finally(() => setLoading(false));
  };
  useEffect(() => {
    recupererAlertes().then(setAlertes).finally(() => setLoading(false));
  }, []);

  const openForm = () => {
    setShowForm(true);
    // Demander la géolocalisation automatiquement
    if (navigator.geolocation) {
      setGpsStatus("loading");
      navigator.geolocation.getCurrentPosition(
        ({ coords: c }) => {
          setForm(f => ({ ...f, latitude: c.latitude, longitude: c.longitude }));
          setGpsStatus("ok");
        },
        () => setGpsStatus("denied"),
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      const res = await api("/api/alertes-sang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        load();
        setShowForm(false);
        setForm({ groupe_sang: "O+", quantite: "", message: "", urgence: "Urgent", rayon_km: null, duree_heures: 72, latitude: null, longitude: null });
        setGpsStatus(null);
      }
    } finally { setSaving(false); }
  };

  const changeStatut = async (id, statut) => {
    await api(`/api/alertes-sang/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    load();
  };

  const voirReponses = async (alerte) => {
    setReponsesModal({ alerte, list: [], loading: true });
    api(`/api/alertes-sang/${alerte.id}/reponses`)
      .then(r => r.ok ? r.json() : [])
      .then(list => setReponsesModal(prev => prev ? { ...prev, list, loading: false } : null))
      .catch(() => setReponsesModal(prev => prev ? { ...prev, loading: false } : null));
  };

  const supprimer = async (id) => {
    await api(`/api/alertes-sang/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
            <Bell size={20} className="text-rose-500" /> Alertes sang
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Lancez des appels aux donneurs compatibles dans votre zone</p>
        </div>
        <button onClick={openForm}
          className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-rose-200"
        >
          <Plus size={14} /> Nouvelle alerte
        </button>
      </motion.div>

      {/* Liste */}
      {loading && <div className="text-center py-16 text-gray-400 text-sm">Chargement…</div>}

      {!loading && alertes.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
          <Bell size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">Aucune alerte lancée pour l'instant</p>
        </div>
      )}

      <div className="space-y-3">
        {alertes.map((a, i) => {
          const ucfg   = URGENCE_CFG[a.urgence] || URGENCE_CFG.Moyen;
          const expiry = tempsRestant(a.expire_at);
          const statutEffectif = (a.statut === "active" && expiry?.expired) ? "expiree" : a.statut;
          const scfg   = STATUT_CFG[statutEffectif] || STATUT_CFG.active;
          return (
            <motion.div key={a.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white border border-gray-200 rounded-xl p-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <Droplets size={20} className="text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[15px] font-bold text-gray-900">Groupe {a.groupe_sang}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ucfg.bg} ${ucfg.text} ${ucfg.border}`}>{a.urgence}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${scfg.bg} ${scfg.text}`}>{scfg.label}</span>
                  </div>

                  {a.quantite && <div className="text-[12px] text-gray-600 mb-0.5">Quantité : {a.quantite}</div>}
                  {a.message  && <div className="text-[12px] text-gray-500 italic">"{a.message}"</div>}

                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-[11px] text-gray-300">
                      {new Date(a.created_at).toLocaleDateString("fr-FR")} · Donneurs ciblés : {(a.groupes_donneurs || []).join(", ")}
                    </span>
                    {a.rayon_km && (
                      <span className="flex items-center gap-0.5 text-[11px] text-blue-500 font-medium">
                        <Navigation size={10} /> Zone {a.rayon_km} km
                      </span>
                    )}
                    {expiry && (
                      <span className={`text-[11px] font-semibold ${expiry.expired ? "text-amber-600" : "text-gray-400"}`}>
                        {expiry.label}
                      </span>
                    )}
                    {/* Compteur réponses — cliquable */}
                    <button
                      onClick={() => voirReponses(a)}
                      className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                        a.nb_reponses > 0
                          ? "bg-green-50 text-green-700 border border-green-100 hover:bg-green-100"
                          : "bg-gray-50 text-gray-400 border border-gray-100 hover:bg-gray-100"
                      }`}
                    >
                      <Users size={10} /> {a.nb_reponses || 0} réponse{a.nb_reponses !== 1 ? "s" : ""}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {a.statut === "active" && !expiry?.expired && (
                    <button onClick={() => changeStatut(a.id, "terminee")}
                      className="flex items-center gap-1 text-[11px] text-emerald-600 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors">
                      <CheckCircle2 size={11} /> Terminer
                    </button>
                  )}
                  <button onClick={() => supprimer(a.id)}
                    className="flex items-center gap-1 text-[11px] text-red-400 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100 transition-colors">
                    <Trash2 size={11} /> Supprimer
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal répondants */}
      <AnimatePresence>
        {reponsesModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[900]"
              onClick={() => setReponsesModal(null)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[901] px-5 pt-5 pb-10 max-w-lg mx-auto shadow-2xl max-h-[80vh] flex flex-col"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 flex-shrink-0" />

              {/* En-tête */}
              <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[17px] font-black text-rose-600">{reponsesModal.alerte.groupe_sang}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-gray-900">Donneurs ayant répondu</div>
                  <div className="text-[12px] text-gray-400">{reponsesModal.alerte.hopital_nom || "Alerte"}</div>
                </div>
                <button onClick={() => setReponsesModal(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <X size={14} className="text-gray-500" />
                </button>
              </div>

              {/* Corps scrollable */}
              <div className="flex-1 overflow-y-auto space-y-2 pb-2">
                {reponsesModal.loading && (
                  <div className="py-10 flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-gray-300" />
                  </div>
                )}

                {!reponsesModal.loading && reponsesModal.list.length === 0 && (
                  <div className="py-10 text-center">
                    <Users size={28} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-[13px] text-gray-400">Aucun donneur n'a encore répondu</p>
                  </div>
                )}

                {reponsesModal.list.map((r, i) => (
                  <motion.div key={r.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3"
                  >
                    {/* Avatar initiale */}
                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0 text-[14px] font-bold text-rose-600">
                      {(r.nom || "?")[0].toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-gray-900 truncate">{r.nom || "Inconnu"}</span>
                        {r.groupe_sanguin && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            {r.groupe_sanguin}
                          </span>
                        )}
                      </div>
                      {r.telephone && (
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone size={9} /> {r.telephone}
                        </div>
                      )}
                      <div className="text-[10px] text-gray-300 mt-0.5">
                        {new Date(r.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    {/* Bouton appel direct */}
                    {r.telephone && (
                      <a href={`tel:${r.telephone}`}
                        className="flex-shrink-0 w-9 h-9 rounded-xl bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors"
                      >
                        <Phone size={14} className="text-green-700" />
                      </a>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal nouvelle alerte */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
                <span className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                  <Bell size={15} className="text-rose-500" /> Nouvelle alerte sang
                </span>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>

              <div className="p-5 space-y-4">

                {/* Info */}
                <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5 text-[12px] text-rose-700">
                  Les donneurs compatibles disponibles seront notifiés automatiquement.
                </div>

                {/* Groupe sanguin */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Groupe sanguin nécessaire *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {GROUPES.map(g => (
                      <button key={g} onClick={() => setForm(f => ({ ...f, groupe_sang: g }))}
                        className={`py-2 rounded-lg text-[13px] font-bold border transition-all ${form.groupe_sang === g ? "bg-rose-600 text-white border-rose-600" : "bg-gray-50 text-gray-700 border-gray-200 hover:border-rose-300"}`}
                      >{g}</button>
                    ))}
                  </div>
                </div>

                {/* Urgence */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Niveau d'urgence</label>
                  <div className="flex gap-2">
                    {URGENCES.map(u => (
                      <button key={u} onClick={() => setForm(f => ({ ...f, urgence: u }))}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${form.urgence === u ? "bg-rose-600 text-white border-rose-600" : "bg-gray-50 text-gray-600 border-gray-200"}`}
                      >{u}</button>
                    ))}
                  </div>
                </div>

                {/* Zone par rayon */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Zone de recherche</label>
                  <div className="grid grid-cols-2 gap-2">
                    {RAYONS.map(r => (
                      <button key={r.label} onClick={() => setForm(f => ({ ...f, rayon_km: r.val }))}
                        className={`py-2 px-3 rounded-lg text-[12px] font-semibold border transition-all text-left flex items-center gap-2 ${
                          form.rayon_km === r.val
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <Navigation size={12} /> {r.label}
                      </button>
                    ))}
                  </div>

                  {/* Statut GPS */}
                  <div className={`mt-2 flex items-center gap-1.5 text-[11px] rounded-lg px-3 py-1.5 ${
                    gpsStatus === "ok"      ? "bg-green-50 text-green-700"
                    : gpsStatus === "denied"  ? "bg-amber-50 text-amber-700"
                    : gpsStatus === "loading" ? "bg-blue-50 text-blue-600"
                    : "bg-gray-50 text-gray-400"
                  }`}>
                    {gpsStatus === "loading" && <Loader2 size={11} className="animate-spin" />}
                    {gpsStatus === "ok"      && <CheckCircle2 size={11} />}
                    {gpsStatus === "denied"  && <AlertTriangle size={11} />}
                    {gpsStatus !== "loading" && <Navigation size={11} />}
                    <span className="flex-1">
                      {gpsStatus === "ok"
                        ? `Position captée (${form.latitude?.toFixed(4)}, ${form.longitude?.toFixed(4)})`
                        : gpsStatus === "loading"
                        ? "Récupération de la position…"
                        : gpsStatus === "denied"
                        ? "Permission refusée — autorisez la localisation dans votre navigateur puis réessayez"
                        : "Position non captée — le filtre zone ne s'appliquera pas"}
                    </span>
                    {gpsStatus === "denied" && (
                      <button
                        onClick={() => {
                          setGpsStatus("loading");
                          navigator.geolocation.getCurrentPosition(
                            ({ coords: c }) => {
                              setForm(f => ({ ...f, latitude: c.latitude, longitude: c.longitude }));
                              setGpsStatus("ok");
                            },
                            () => setGpsStatus("denied"),
                            { enableHighAccuracy: true, timeout: 8000 }
                          );
                        }}
                        className="flex-shrink-0 text-[10px] font-semibold underline hover:no-underline"
                      >
                        Réessayer
                      </button>
                    )}
                  </div>
                </div>

                {/* Durée de validité */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Durée de validité</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {DUREES.map(d => (
                      <button key={d.label} onClick={() => setForm(f => ({ ...f, duree_heures: d.val }))}
                        className={`py-2 px-3 rounded-lg text-[12px] font-semibold border transition-all ${
                          form.duree_heures === d.val
                            ? "bg-rose-600 text-white border-rose-600"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:border-rose-300"
                        }`}
                      >{d.label}</button>
                    ))}
                  </div>
                  {form.duree_heures && (
                    <p className="mt-1.5 text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
                      Cette alerte expirera automatiquement après {DUREES.find(d => d.val === form.duree_heures)?.label}.
                    </p>
                  )}
                </div>

                {/* Quantité */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Quantité (optionnel)</label>
                  <input value={form.quantite} onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))}
                    placeholder="Ex: 2 poches, 500 ml…" className={INPUT} />
                </div>

                {/* Message */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Message (optionnel)</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Ex: Patient en salle d'opération, besoin urgent…"
                    rows={2} className={INPUT + " resize-none"} />
                </div>

                {/* Résumé donneurs ciblés */}
                <div className="text-[11px] text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                  Donneurs ciblés : <strong className="text-gray-600">{(AlerteSang_COMPAT[form.groupe_sang] || []).join(", ")}</strong>
                  {form.rayon_km && <span className="ml-1 text-blue-500">· dans un rayon de {form.rayon_km} km</span>}
                </div>

                <button onClick={submit} disabled={saving || !form.groupe_sang}
                  className="w-full h-11 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <><Bell size={14} /> Lancer l'alerte</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
