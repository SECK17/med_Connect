import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Mail, Phone, Droplets, FileText, CalendarDays, CheckCircle2, XCircle, X, Bell } from "lucide-react";

const STATUT_BADGE = {
  transfere:  "bg-blue-100 text-blue-700",
  confirme:   "bg-emerald-100 text-emerald-700",
  annule:     "bg-red-100 text-red-700",
};

const INPUT = "w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white";

export default function DemandesRDV() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [form, setForm] = useState({ date: "", heure: "" });
  const [motifModal, setMotifModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [refusModal, setRefusModal] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const pushNotifMedecin = (notif) => {
    const key = "medconnect_medecin_notifications";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([notif, ...existing]));
  };

  const token = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    if (!token || !userId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/rendezvous/medecin/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const transferes = data.filter(r => r.statut === 'transfere');
        setDemandes(transferes);

        const seenKey = "medconnect_medecin_rdv_seen";
        const seen = new Set(JSON.parse(localStorage.getItem(seenKey) || "[]"));
        const newOnes = transferes.filter(r => !seen.has(r.id));
        if (newOnes.length > 0) {
          newOnes.forEach(rdv => {
            pushNotifMedecin({
              id: Date.now().toString() + rdv.id,
              type: "info",
              title: "Nouveau RDV transmis",
              message: `Le secrétaire vous a transféré une demande de ${rdv.patient?.user?.nom || "patient"}.`,
              read: false,
              date: new Date().toISOString(),
            });
          });
          localStorage.setItem(seenKey, JSON.stringify([...seen, ...newOnes.map(r => r.id)]));
        }
      }
    } catch (err) {
      console.error("Erreur chargement demandes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleValider = async (rdvId) => {
    if (!form.date || !form.heure) {
      showToast("Veuillez sélectionner une date et une heure", "error");
      return;
    }

    const rdv = demandes.find(r => r.id === rdvId);
    const nomPatient = rdv?.patient?.user?.nom || "le patient";
    const dateFormatee = new Date(form.date).toLocaleDateString("fr-FR");

    try {
      const res = await fetch(`http://localhost:5000/api/rendezvous/${rdvId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date_rdv: form.date, heure: form.heure, statut: "confirme" }),
      });

      if (res.ok) {
        pushNotifMedecin({
          id: Date.now().toString(),
          type: "success",
          title: "Rendez-vous confirmé",
          message: `Votre RDV avec ${nomPatient} est confirmé le ${dateFormatee} à ${form.heure}.`,
          read: false,
          date: new Date().toISOString(),
        });
        showToast(`RDV avec ${nomPatient} confirmé le ${dateFormatee} à ${form.heure}`);
        setSelectedRdv(null);
        setForm({ date: "", heure: "" });
        fetchDemandes();
      }
    } catch (err) {
      showToast("Erreur lors de la validation", "error");
    }
  };

  const handleRefuser = async (rdvId) => {
    const rdv = demandes.find(r => r.id === rdvId);
    const nomPatient = rdv?.patient?.user?.nom || "ce patient";
    try {
      const res = await fetch(`http://localhost:5000/api/rendezvous/${rdvId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statut: "annule" }),
      });

      if (res.ok) {
        pushNotifMedecin({
          id: Date.now().toString(),
          type: "info",
          title: "Demande refusée",
          message: `Vous avez refusé la demande de ${nomPatient}.`,
          read: false,
          date: new Date().toISOString(),
        });
        showToast(`Demande de ${nomPatient} refusée`, "info");
        setRefusModal(null);
        setSelectedRdv(null);
        fetchDemandes();
      }
    } catch (err) {
      showToast("Erreur lors du refus", "error");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chargement…</div>
  );

  return (
    <>
    {/* Toast */}
    <AnimatePresence>
      {toast && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          className={`fixed top-5 right-5 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-[13px] font-medium border ${
            toast.type === "error"   ? "bg-red-50 border-red-200 text-red-700"     :
            toast.type === "info"    ? "bg-blue-50 border-blue-200 text-blue-700"  :
            "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          {toast.type === "error" ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>

    {/* Modale confirmation refus */}
    <AnimatePresence>
      {refusModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setRefusModal(null)}
        >
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle size={18} className="text-red-600" />
              </div>
              <div className="font-semibold text-gray-900">Refuser la demande ?</div>
            </div>
            <p className="text-[13px] text-gray-500 mb-5">
              La demande de <span className="font-semibold text-gray-800">{refusModal.patient?.user?.nom || "ce patient"}</span> sera annulée.
            </p>
            <div className="flex gap-2">
              <button onClick={() => handleRefuser(refusModal.id)}
                className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold rounded-xl transition-colors">
                Confirmer le refus
              </button>
              <button onClick={() => setRefusModal(null)}
                className="h-10 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] rounded-xl transition-colors">
                Annuler
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Modale motif */}
    <AnimatePresence>
      {motifModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setMotifModal(null)}
        >
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-semibold text-gray-900">
                <FileText size={16} className="text-blue-600" />
                Motif de consultation
              </div>
              <button onClick={() => setMotifModal(null)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="text-[13px] text-gray-500 mb-1">
              Patient : <span className="font-semibold text-gray-800">{motifModal.patient?.user?.nom || "—"}</span>
            </div>
            {motifModal.date_rdv && (
              <div className="text-[13px] text-gray-500 mb-4">
                Date souhaitée : <span className="font-semibold text-gray-800">{new Date(motifModal.date_rdv).toLocaleDateString("fr-FR")}</span>
                {motifModal.heure && <span className="ml-2 font-semibold text-gray-800">à {motifModal.heure}</span>}
              </div>
            )}
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[14px] text-gray-700 leading-relaxed">
              {motifModal.motif}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    <div className="space-y-5">
      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-5 text-white shadow-lg shadow-blue-200"
      >
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-extrabold tracking-tight">Demandes de rendez-vous</h1>
            <p className="text-blue-100 text-[13px] mt-0.5">
              {demandes.length === 0 ? "Aucune demande transmise par le secrétaire" : `${demandes.length} demande${demandes.length > 1 ? "s" : ""} transmise${demandes.length > 1 ? "s" : ""} à traiter`}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
            {demandes.length > 0
              ? <span className="text-xl font-black text-white">{demandes.length}</span>
              : <CalendarDays size={22} className="text-white" />
            }
          </div>
        </div>
      </motion.div>

      {demandes.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl py-14 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
            <CalendarDays size={28} className="text-blue-300" />
          </div>
          <p className="text-gray-600 font-semibold text-sm">Aucune demande transmise</p>
          <p className="text-gray-400 text-[12px] mt-1">Le secrétaire vous transmettra les demandes des patients</p>
        </div>
      ) : (
        <div className="space-y-4">
          {demandes.map((rdv, i) => {
            const p = rdv.patient || {};
            const u = p.user || {};
            const isOpen = selectedRdv === rdv.id;
            return (
              <motion.div key={rdv.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
              >
                {/* En-tête patient */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-[15px] flex-shrink-0">
                        {(u.nom || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[15px] font-semibold text-gray-900">{u.nom || "Patient inconnu"}</div>
                        <div className="text-[12px] text-gray-500 mt-0.5">
                          {rdv.created_at ? new Date(rdv.created_at).toLocaleDateString("fr-FR") : "—"}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUT_BADGE["transfere"]}`}>
                      Transmis par le secrétaire
                    </span>
                  </div>

                  {/* Infos patient */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {u.email && (
                      <div className="flex items-center gap-2 text-[12px] text-gray-600">
                        <Mail size={12} className="text-gray-400 flex-shrink-0" /> {u.email}
                      </div>
                    )}
                    {u.telephone && (
                      <div className="flex items-center gap-2 text-[12px] text-gray-600">
                        <Phone size={12} className="text-gray-400 flex-shrink-0" /> {u.telephone}
                      </div>
                    )}
                    {p.groupeSanguin && (
                      <div className="flex items-center gap-2 text-[12px] text-gray-600">
                        <Droplets size={12} className="text-red-400 flex-shrink-0" />
                        <span>Groupe <span className="font-bold text-red-600">{p.groupeSanguin}</span></span>
                      </div>
                    )}
                    {p.dateNaissance && (
                      <div className="flex items-center gap-2 text-[12px] text-gray-600">
                        <User size={12} className="text-gray-400 flex-shrink-0" />
                        {new Date().getFullYear() - new Date(p.dateNaissance).getFullYear()} ans
                      </div>
                    )}
                  </div>

                  {/* Bouton voir motif */}
                  {rdv.motif && (
                    <button onClick={() => setMotifModal(rdv)}
                      className="mt-3 flex items-center gap-1.5 text-[12px] text-blue-700 font-medium hover:text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <FileText size={12} /> Voir le motif
                    </button>
                  )}
                </div>

                {/* Zone créneau */}
                <div className="border-t border-gray-100 px-5 py-3">
                  <AnimatePresence mode="wait">
                    {isOpen ? (
                      <motion.div key="form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
                        <div className="text-[12px] font-semibold text-gray-700 mb-2">Proposer un créneau</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-gray-500 mb-1">Date *</label>
                            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                              min={new Date().toISOString().split("T")[0]} className={INPUT} />
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-500 mb-1">Heure *</label>
                            <select value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })} className={INPUT}>
                              <option value="">Choisir</option>
                              {["08h00","08h30","09h00","09h30","10h00","10h30","11h00","11h30","13h00","13h30","14h00","14h30","15h00","15h30","16h00","16h30"].map(h => <option key={h}>{h}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => handleValider(rdv.id)}
                            className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                            <CheckCircle2 size={14} /> Valider
                          </button>
                          <button onClick={() => setSelectedRdv(null)}
                            className="h-11 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] rounded-lg transition-colors">
                            Annuler
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
                        <button onClick={() => setSelectedRdv(rdv.id)}
                          className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                          <CalendarDays size={13} /> Proposer un créneau
                        </button>
                        <button onClick={() => setRefusModal(rdv)}
                          className="h-11 px-4 bg-red-50 hover:bg-red-100 text-red-600 text-[13px] font-semibold rounded-lg flex items-center justify-center gap-1.5 border border-red-200 transition-colors">
                          <XCircle size={13} /> Refuser
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
}
