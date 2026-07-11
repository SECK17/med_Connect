import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Clock, X, CheckCircle2, AlertCircle, Stethoscope, Building2, History, MessageSquare, Star } from "lucide-react";

const STATUS_STYLE = {
  "En attente": { cls: "bg-amber-100 text-amber-800",     icon: AlertCircle,    iconCls: "text-amber-500"   },
  "Transmis":   { cls: "bg-blue-100 text-blue-800",       icon: CheckCircle2,   iconCls: "text-blue-500"    },
  "Confirmé":   { cls: "bg-emerald-100 text-emerald-800", icon: CheckCircle2,   iconCls: "text-emerald-500" },
  "Annulé":     { cls: "bg-red-100 text-red-800",         icon: X,              iconCls: "text-red-500"     },
};

const SPECIALITES = [
  "Généraliste","Cardiologue","Dentiste","Gynécologue","Pédiatre",
  "Dermatologue","Ophtalmologue","ORL","Neurologue","Pneumologue",
  "Gastro-entérologue","Urologue","Psychiatre","Oncologue","Chirurgien",
];

const HEURES = [
  "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30",
];

export default function RendezVous() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab]         = useState("liste");
  const [filtre, setFiltre]   = useState("tous"); // "tous" | "avenir" | "historique"
  const [appointments, setAppointments] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [form, setForm] = useState({ medecinId: "", specialite: "", date: "", heure: "", type: "Présentiel", reason: "" });
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [evalModal, setEvalModal] = useState(null); // { doctorId, doctorName, rdvId }
  const [evalNote, setEvalNote]   = useState(0);
  const [evalSent, setEvalSent]   = useState(false);
  const [mesEvals, setMesEvals]   = useState({}); // { [medecinId]: note }

  const token = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("medconnect_appointments") || "[]");
    setAppointments(saved);
    fetchFromAPI();
    fetchMedecins();
    // Charger mes évaluations déjà soumises
    if (token) {
      fetch("http://localhost:5000/api/evaluations/patient/moi", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          const map = {};
          data.forEach(e => { map[String(e.medecin_id)] = e.note; });
          setMesEvals(map);
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (location.state?.medecinId) {
      setForm(f => ({ ...f, medecinId: String(location.state.medecinId) }));
      setTab("nouveau");
    } else if (location.state?.filtre) {
      const map = { avenir: "avenir", historique: "passes", annules: "annules" };
      setFiltre(map[location.state.filtre] || "tous");
      setTab("liste");
    }
  }, [location.state]);

  const fetchFromAPI = async () => {
    if (!token || !userId) { setLoading(false); return; }
    try {
      const res = await fetch(`http://localhost:5000/api/rendezvous/patient/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();

        // Détection changement de statut → notifications patient
        const seen = JSON.parse(localStorage.getItem("medconnect_patient_rdv_seen") || "{}");
        const newNotifs = [];
        data.forEach(r => {
          const prev = seen[String(r.id)];
          const cur  = r.statut;
          if (prev && prev !== cur) {
            const doc = r.medecin?.user?.nom || "votre médecin";
            const d   = r.date_rdv ? new Date(r.date_rdv).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : "";
            if (cur === "confirme") {
              newNotifs.push({ title: "Rendez-vous confirmé", message: `Dr. ${doc} a confirmé votre RDV${d ? " du " + d : ""}.`, type: "success", date: new Date().toISOString(), read: false });
            } else if (cur === "annule") {
              newNotifs.push({ title: "Rendez-vous annulé", message: `Votre RDV avec Dr. ${doc}${d ? " du " + d : ""} a été annulé.`, type: "error", date: new Date().toISOString(), read: false });
            }
          }
          seen[String(r.id)] = cur;
        });
        localStorage.setItem("medconnect_patient_rdv_seen", JSON.stringify(seen));
        if (newNotifs.length > 0) {
          const existing = JSON.parse(localStorage.getItem("medconnect_patient_notifications") || "[]");
          localStorage.setItem("medconnect_patient_notifications", JSON.stringify([...newNotifs, ...existing]));
        }

        const mapped = data.map(r => ({
          id: String(r.id),
          doctorId: String(r.medecin_id),
          doctorName: r.medecin?.user?.nom || "Médecin",
          specialty: r.medecin?.specialite || "Généraliste",
          doctorPhoto: "",
          date: r.date_rdv?.split("T")[0] || "",
          time: r.heure || "",
          type: "Présentiel",
          status: r.statut === "confirme" ? "Confirmé" : r.statut === "annule" ? "Annulé" : r.statut === "transfere" ? "Transmis" : "En attente",
          reason: r.motif || "",
        }));
        localStorage.setItem("medconnect_appointments", JSON.stringify(mapped));
        setAppointments(mapped);
      }
    } catch {}
    setLoading(false);
  };

  const fetchMedecins = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/medecins", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) setMedecins(await res.json());
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const medecinChoisi = medecins.find(m => String(m.id) === form.medecinId);
    const newRdv = {
      id: Date.now().toString(),
      doctorId: form.medecinId,
      doctorName: medecinChoisi?.nom || "Médecin",
      specialty: medecinChoisi?.specialite || form.specialite,
      doctorPhoto: "",
      date: form.date,
      time: form.heure,
      type: form.type,
      status: "En attente",
      reason: form.reason,
    };

    if (token && userId) {
      try {
        const res = await fetch("http://localhost:5000/api/rendezvous", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            patientId: userId, medecinId: form.medecinId,
            date: form.date, heure: form.heure, motif: form.reason,
          }),
        });
        if (res.ok) {
          const created = await res.json();
          newRdv.id = String(created.id);
        }
      } catch {}
    }

    const updated = [newRdv, ...appointments];
    localStorage.setItem("medconnect_appointments", JSON.stringify(updated));
    setAppointments(updated);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setTab("liste"); setForm({ medecinId: "", specialite: "", date: "", heure: "", type: "Présentiel", reason: "" }); }, 2000);
  };

  const annuler = (id) => {
    const updated = appointments.map(a => a.id === id ? { ...a, status: "Annulé" } : a);
    localStorage.setItem("medconnect_appointments", JSON.stringify(updated));
    setAppointments(updated);
    // Marquer comme "annule" dans seen pour éviter une fausse notification
    const seen = JSON.parse(localStorage.getItem("medconnect_patient_rdv_seen") || "{}");
    seen[String(id)] = "annule";
    localStorage.setItem("medconnect_patient_rdv_seen", JSON.stringify(seen));
    if (token) {
      fetch(`http://localhost:5000/api/rendezvous/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statut: "annule" }),
      }).catch(() => {});
    }
  };

  const submitEval = async () => {
    if (!evalNote || !evalModal) return;
    try {
      await fetch("http://localhost:5000/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ medecin_id: evalModal.doctorId, rdv_id: evalModal.rdvId, note: evalNote }),
      });
      setMesEvals(prev => ({ ...prev, [String(evalModal.doctorId)]: evalNote }));
      setEvalSent(true);
      setTimeout(() => { setEvalModal(null); setEvalNote(0); setEvalSent(false); }, 1500);
    } catch {}
  };

  const today  = new Date(new Date().toDateString());
  const avenir = appointments.filter(a => a.status !== "Annulé" && new Date(a.date) >= today)
                              .sort((a, b) => new Date(a.date) - new Date(b.date));
  const passes = appointments.filter(a => a.status !== "Annulé" && new Date(a.date) < today)
                              .sort((a, b) => new Date(b.date) - new Date(a.date));
  const annules = appointments.filter(a => a.status === "Annulé")
                               .sort((a, b) => new Date(b.date) - new Date(a.date));

  const listeAffichee =
    filtre === "avenir"  ? avenir  :
    filtre === "passes"  ? passes  :
    filtre === "annules" ? annules :
    [...avenir, ...passes, ...annules];

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Mes rendez-vous</h1>
        <p className="text-sm text-gray-500 mt-1">Gérez vos consultations médicales</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[["liste", "Mes rendez-vous"], ["nouveau", "Prendre un RDV"]].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
              tab === k ? "text-blue-600 border-blue-600" : "text-gray-500 border-transparent hover:text-gray-800"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── LISTE ── */}
        {tab === "liste" && (
          <motion.div key="liste" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="space-y-4">

            {/* Cartes filtres */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { val: "tous",    label: "Tous",    count: appointments.length, icon: Calendar, bg: "bg-gray-100",     border: "border-gray-400",    ico: "text-gray-600",    num: "text-gray-800"    },
                { val: "avenir",  label: "À venir", count: avenir.length,       icon: Clock,    bg: "bg-emerald-100", border: "border-emerald-500",  ico: "text-emerald-700", num: "text-emerald-800" },
                { val: "passes",  label: "Passés",  count: passes.length,       icon: History,  bg: "bg-blue-100",    border: "border-blue-400",     ico: "text-blue-700",    num: "text-blue-800"    },
                { val: "annules", label: "Annulés", count: annules.length,      icon: X,        bg: "bg-red-100",     border: "border-red-400",      ico: "text-red-600",     num: "text-red-800"     },
              ].map(({ val, label, count, icon: Icon, bg, border, ico, num }) => (
                <motion.button
                  key={val}
                  onClick={() => setFiltre(val)}
                  whileTap={{ scale: 0.97 }}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${bg} ${
                    filtre === val ? `${border} shadow-md scale-[1.02]` : "border-transparent hover:border-opacity-50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center mb-2">
                    <Icon size={15} className={ico} />
                  </div>
                  <div className={`text-2xl font-bold leading-none mb-1 ${num}`}>
                    {count}
                  </div>
                  <div className={`text-[11px] font-semibold ${ico}`}>{label}</div>
                </motion.button>
              ))}
            </div>

            {/* Liste */}
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {loading && (
                <div className="py-10 text-center text-sm text-gray-400">Chargement...</div>
              )}
              {!loading && listeAffichee.length === 0 && (
                <div className="py-12 text-center">
                  <Calendar size={32} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-sm text-gray-500">Aucun rendez-vous dans cette catégorie</p>
                </div>
              )}
              {!loading && listeAffichee.map((r) => (
                <RdvCard key={r.id} rdv={r}
                  onAnnuler={r.status === "En attente" ? annuler : null}
                  onChat={(rdv) => navigate("../messages", { state: { medecinId: parseInt(rdv.doctorId), medecinNom: rdv.doctorName } })}
                  onEvaluer={
                    r.status === "Confirmé" && new Date(r.date) < today
                      ? () => { setEvalModal({ doctorId: r.doctorId, doctorName: r.doctorName, rdvId: r.id }); setEvalNote(mesEvals[r.doctorId] || 0); }
                      : null
                  }
                  dejaEvalue={mesEvals[r.doctorId]}
                  formatDate={formatDate} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── NOUVEAU ── */}
        {tab === "nouveau" && (
          <motion.div key="nouveau" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-900 mb-5">
                <Calendar size={15} className="text-blue-600" /> Prendre un rendez-vous
              </div>

              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-[13px] px-4 py-3 rounded-lg mb-4"
                  >
                    <CheckCircle2 size={15} /> Votre rendez-vous a été pris avec succès !
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Médecin *">
                    <select
                      value={form.medecinId}
                      onChange={e => {
                        const m = medecins.find(x => String(x.id) === e.target.value);
                        setForm(f => ({ ...f, medecinId: e.target.value, specialite: m?.specialite || "" }));
                      }}
                      required
                      className={INPUT}
                    >
                      <option value="">Sélectionner</option>
                      {medecins.map(m => <option key={m.id} value={m.id}>{m.nom} — {m.specialite || "Généraliste"}</option>)}
                    </select>
                  </Field>
                  <Field label="Spécialité">
                    <div className={`${INPUT} bg-gray-50 text-gray-500 cursor-not-allowed`}>
                      {form.specialite || (form.medecinId ? "—" : "Choisir un médecin d'abord")}
                    </div>
                  </Field>
                  <Field label="Date *">
                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required min={new Date().toISOString().split("T")[0]} className={INPUT} />
                  </Field>
                  <Field label="Heure *">
                    <select value={form.heure} onChange={e => setForm(f => ({ ...f, heure: e.target.value }))} required className={INPUT}>
                      <option value="">Choisir</option>
                      {HEURES.map(h => <option key={h}>{h}</option>)}
                    </select>
                  </Field>
                  <Field label="Type de consultation">
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={INPUT}>
                      <option>Présentiel</option>
                      <option>Téléconsultation</option>
                    </select>
                  </Field>
                </div>
                <Field label="Motif de consultation *">
                  <textarea
                    value={form.reason}
                    onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="Décrivez brièvement votre motif…"
                    required rows={3}
                    className={`${INPUT} resize-none`}
                  />
                </Field>

                {form.medecinId && (() => {
                  const m = medecins.find(x => String(x.id) === form.medecinId);
                  return m ? (
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-800 text-[13px] px-4 py-3 rounded-lg">
                      <Building2 size={14} />
                      <strong>{m.nom}</strong> · {m.hopital || "Hôpital non précisé"}
                    </div>
                  ) : null;
                })()}

                <div className="flex gap-3 pt-1">
                  <button type="submit" className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                    Confirmer le rendez-vous
                  </button>
                  <button type="button" onClick={() => setTab("liste")} className="px-4 h-11 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL ÉVALUATION ── */}
      <AnimatePresence>
        {evalModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[900]" onClick={() => setEvalModal(null)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[901] px-6 pt-5 pb-10 max-w-lg mx-auto"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              {evalSent ? (
                <div className="py-6 text-center">
                  <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
                  <p className="font-semibold text-gray-900">Merci pour votre avis !</p>
                </div>
              ) : (
                <>
                  <div className="text-[15px] font-bold text-gray-900 mb-1">Évaluer le Dr. {evalModal.doctorName}</div>
                  <p className="text-[12px] text-gray-400 mb-6">Comment s'est passée votre consultation ?</p>
                  <div className="flex justify-center gap-3 mb-6">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setEvalNote(n)}>
                        <Star
                          size={36}
                          className={`transition-colors ${n <= evalNote ? "text-amber-400 fill-amber-400" : "text-gray-200"}`}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="text-center text-[12px] text-gray-400 mb-6 h-4">
                    {evalNote === 1 && "Très mauvais"} {evalNote === 2 && "Mauvais"}
                    {evalNote === 3 && "Correct"} {evalNote === 4 && "Bien"} {evalNote === 5 && "Excellent !"}
                  </div>
                  <button
                    onClick={submitEval}
                    disabled={!evalNote}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-2xl transition-colors"
                  >
                    Envoyer mon avis
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const INPUT = "w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white";

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function RdvCard({ rdv, onAnnuler, onChat, onEvaluer, dejaEvalue, formatDate }) {
  const style = STATUS_STYLE[rdv.status] || STATUS_STYLE["En attente"];
  const StatusIcon = style.icon;
  return (
    <div className="flex items-start gap-3 py-4 px-4">
      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[15px] font-bold flex-shrink-0 mt-0.5">
        {rdv.doctorName[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-gray-900">{rdv.doctorName}</div>
        <div className="text-[12px] text-gray-500">{rdv.specialty} · {rdv.type}</div>
        {rdv.reason && <div className="text-[12px] text-gray-400 truncate">📝 {rdv.reason}</div>}
        {dejaEvalue && (
          <div className="flex items-center gap-0.5 mt-1">
            {[1,2,3,4,5].map(n => (
              <Star key={n} size={10} className={n <= dejaEvalue ? "text-amber-400 fill-amber-400" : "text-gray-200"} />
            ))}
            <span className="text-[10px] text-gray-400 ml-1">Votre avis</span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <div className="text-[11px] text-gray-500 flex items-center gap-1">
          <Clock size={10} /> {formatDate(rdv.date)} à {rdv.time}
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${style.cls}`}>
          <StatusIcon size={10} /> {rdv.status}
        </span>
        {onAnnuler && (
          <button onClick={() => onAnnuler(rdv.id)}
            className="text-[11px] text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 px-2 py-0.5 rounded transition-colors">
            Annuler
          </button>
        )}
        {rdv.status === "Confirmé" && onChat && (
          <button onClick={() => onChat(rdv)}
            className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 border border-blue-200 hover:bg-blue-50 px-2 py-0.5 rounded transition-colors">
            <MessageSquare size={10} /> Contacter
          </button>
        )}
        {onEvaluer && (
          <button onClick={onEvaluer}
            className="flex items-center gap-1 text-[11px] text-amber-600 hover:text-amber-800 border border-amber-200 hover:bg-amber-50 px-2 py-0.5 rounded transition-colors">
            <Star size={10} /> {dejaEvalue ? "Modifier l'avis" : "Évaluer"}
          </button>
        )}
      </div>
    </div>
  );
}
