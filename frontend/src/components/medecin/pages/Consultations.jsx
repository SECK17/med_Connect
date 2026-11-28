import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ClipboardList, Plus, Search, X, CheckCircle2, CalendarDays } from "lucide-react";
import { API_URL } from "../../../config.js";

const INPUT = "w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white";

export default function MedecinConsultations() {
  const [consultations, setConsultations] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [modal,    setModal]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ patient_id: "", date: new Date().toISOString().split("T")[0], motif: "", diagnostic: "", traitement: "", notes: "" });

  const token  = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

  // recuperer…() fait la requête sans toucher à l'état : utilisable tel quel au montage.
  const recupererConsultations = () => fetch(`${API_URL}/api/consultations/medecin/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.ok ? r.json() : []);
  const load = () => {
    setLoading(true);
    recupererConsultations().then(setConsultations).finally(() => setLoading(false));
  };

  useEffect(() => {
    recupererConsultations().then(setConsultations).finally(() => setLoading(false));
    fetch(`${API_URL}/api/rendezvous/medecin/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const seen = new Set();
        const uniq = [];
        for (const r of data) {
          if (!seen.has(r.patient_id)) {
            seen.add(r.patient_id);
            uniq.push({ id: r.patient_id, nom: r.patient?.user?.nom || "Patient" });
          }
        }
        setPatients(uniq);
      });
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const submit = async () => {
    if (!form.patient_id) return showToast("Sélectionnez un patient.", "error");
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/consultations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast("Consultation enregistrée.");
        setModal(false);
        setForm({ patient_id: "", date: new Date().toISOString().split("T")[0], motif: "", diagnostic: "", traitement: "", notes: "" });
        load();
      } else {
        const d = await res.json();
        showToast(d.message || "Erreur", "error");
      }
    } catch { showToast("Erreur réseau.", "error"); }
    finally { setSaving(false); }
  };

  const filtered = consultations.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.patient?.user?.nom || "").toLowerCase().includes(q) || (c.diagnostic || "").toLowerCase().includes(q);
  });

  const fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";

  return (
    <div className="space-y-5">

      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold border ${
          toast.type === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-800"
        }`}>
          {toast.type === "error" ? <X size={13}/> : <CheckCircle2 size={13}/>} {toast.msg}
        </div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList size={20} className="text-blue-600" /> Consultations
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{consultations.length} consultation{consultations.length !== 1 ? "s" : ""} enregistrée{consultations.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setModal(true)}
          className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[13px] rounded-xl flex items-center gap-2 transition-colors shadow-sm shadow-blue-200"
        >
          <Plus size={14}/> Nouvelle
        </button>
      </motion.div>

      {/* Recherche */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input
          className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
          placeholder="Rechercher patient ou diagnostic…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Liste */}
      {loading && <div className="text-center py-16 text-gray-400 text-sm">Chargement…</div>}

      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center">
          <ClipboardList size={30} className="mx-auto text-gray-200 mb-3"/>
          <p className="text-[13px] text-gray-400">
            {consultations.length === 0 ? "Aucune consultation enregistrée." : "Aucun résultat."}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((c, i) => (
          <motion.div key={c.id}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-sm hover:border-blue-200 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-[14px] flex-shrink-0">
                {(c.patient?.user?.nom || "P")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[14px] font-bold text-gray-900">{c.patient?.user?.nom || "—"}</span>
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <CalendarDays size={9}/> {fmtDate(c.date)}
                  </span>
                </div>
                {c.motif && <div className="text-[12px] text-blue-600 font-medium mt-0.5">{c.motif}</div>}
                {c.diagnostic && (
                  <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2">
                    <div className="text-[11px] font-semibold text-gray-500 mb-0.5">Diagnostic</div>
                    <div className="text-[13px] text-gray-800 line-clamp-2">{c.diagnostic}</div>
                  </div>
                )}
                {c.traitement && (
                  <div className="mt-1.5 bg-emerald-50 rounded-lg px-3 py-2">
                    <div className="text-[11px] font-semibold text-emerald-600 mb-0.5">Traitement</div>
                    <div className="text-[13px] text-gray-800 line-clamp-2">{c.traitement}</div>
                  </div>
                )}
                {c.notes && <div className="text-[11px] text-gray-400 mt-1.5 italic line-clamp-1">Notes : {c.notes}</div>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal nouvelle consultation */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40" onClick={() => setModal(false)}
            />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="text-[15px] font-bold text-gray-900">Nouvelle consultation</div>
                  <button onClick={() => setModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                    <X size={16}/>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-semibold text-gray-600">Patient *</label>
                      <select value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} className={INPUT}>
                        <option value="">Sélectionner</option>
                        {patients.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-semibold text-gray-600">Date</label>
                      <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={INPUT}/>
                    </div>
                  </div>

                  {[
                    { key: "motif",      label: "Motif",      rows: 1 },
                    { key: "diagnostic", label: "Diagnostic", rows: 3 },
                    { key: "traitement", label: "Traitement", rows: 2 },
                    { key: "notes",      label: "Notes",      rows: 2 },
                  ].map(({ key, label, rows }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-semibold text-gray-600">{label}</label>
                      <textarea rows={rows} value={form[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className={`${INPUT} resize-none`}
                        placeholder={`${label}…`}
                      />
                    </div>
                  ))}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                  <button onClick={submit} disabled={saving}
                    className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl text-[13px] transition-colors"
                  >
                    {saving ? "Enregistrement…" : "Enregistrer"}
                  </button>
                  <button onClick={() => setModal(false)}
                    className="px-5 h-10 border border-gray-200 text-gray-600 rounded-xl text-[13px] hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
