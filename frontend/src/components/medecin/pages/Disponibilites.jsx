import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Clock, CheckCircle2, X } from "lucide-react";
import { API_URL } from "../../../config.js";

const JOURS = [
  { key: "lundi",    label: "Lundi"    },
  { key: "mardi",    label: "Mardi"    },
  { key: "mercredi", label: "Mercredi" },
  { key: "jeudi",    label: "Jeudi"    },
  { key: "vendredi", label: "Vendredi" },
  { key: "samedi",   label: "Samedi"   },
  { key: "dimanche", label: "Dimanche" },
];

const DEFAULT = { actif: false, debut: "08:00", fin: "17:00" };

const HEURES = [
  "06:00","06:30","07:00","07:30","08:00","08:30","09:00","09:30",
  "10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30",
  "14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30",
  "18:00","18:30","19:00","19:30","20:00",
];

const INPUT = "px-2 py-1.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white";

export default function MedecinDisponibilites() {
  const [dispo,   setDispo]   = useState(() =>
    Object.fromEntries(JOURS.map(j => [j.key, { ...DEFAULT, actif: !["samedi","dimanche"].includes(j.key) }]))
  );
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);
  const [loading, setLoading] = useState(true);

  const token  = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    fetch(`${API_URL}/api/medecins/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.profil_medecin?.disponibilites) setDispo(d.profil_medecin.disponibilites);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (jour) => setDispo(d => ({ ...d, [jour]: { ...d[jour], actif: !d[jour].actif } }));
  const setHeure = (jour, field, val) => setDispo(d => ({ ...d, [jour]: { ...d[jour], [field]: val } }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/medecins/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ disponibilites: dispo }),
      });
      if (res.ok) { setToast({ msg: "Disponibilités enregistrées.", type: "success" }); }
      else { setToast({ msg: "Erreur lors de l'enregistrement.", type: "error" }); }
    } catch { setToast({ msg: "Erreur réseau.", type: "error" }); }
    finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const actifs = Object.values(dispo).filter(d => d.actif).length;

  return (
    <div className="space-y-5">

      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold border ${
          toast.type === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-800"
        }`}>
          {toast.type === "error" ? <X size={13}/> : <CheckCircle2 size={13}/>} {toast.msg}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
          <Clock size={20} className="text-blue-600" /> Mes disponibilités
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Définissez vos jours et heures de travail — {actifs} jour{actifs !== 1 ? "s" : ""} actif{actifs !== 1 ? "s" : ""}
        </p>
      </motion.div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Chargement…</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {JOURS.map((j, i) => {
            const d = dispo[j.key] || DEFAULT;
            return (
              <motion.div key={j.key}
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                  i < JOURS.length - 1 ? "border-b border-gray-100" : ""
                } ${d.actif ? "bg-white" : "bg-gray-50/60"}`}
              >
                {/* Toggle */}
                <button onClick={() => toggle(j.key)}
                  className={`relative w-10 h-5.5 rounded-full flex-shrink-0 transition-colors ${d.actif ? "bg-blue-600" : "bg-gray-300"}`}
                  style={{ height: "22px", width: "40px" }}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${d.actif ? "translate-x-[20px]" : "translate-x-0.5"}`} />
                </button>

                {/* Jour */}
                <div className={`w-24 text-[14px] font-semibold flex-shrink-0 ${d.actif ? "text-gray-900" : "text-gray-400"}`}>
                  {j.label}
                </div>

                {/* Heures */}
                {d.actif ? (
                  <div className="flex items-center gap-2 flex-1">
                    <select value={d.debut} onChange={e => setHeure(j.key, "debut", e.target.value)} className={INPUT}>
                      {HEURES.map(h => <option key={h}>{h}</option>)}
                    </select>
                    <span className="text-[13px] text-gray-400 font-medium">→</span>
                    <select value={d.fin} onChange={e => setHeure(j.key, "fin", e.target.value)} className={INPUT}>
                      {HEURES.map(h => <option key={h}>{h}</option>)}
                    </select>
                    <span className="text-[11px] text-gray-400 ml-1">
                      {(() => {
                        const [dh, dm] = d.debut.split(":").map(Number);
                        const [fh, fm] = d.fin.split(":").map(Number);
                        const diff = (fh * 60 + fm) - (dh * 60 + dm);
                        return diff > 0 ? `${Math.floor(diff/60)}h${diff%60 ? diff%60 : ""}` : "";
                      })()}
                    </span>
                  </div>
                ) : (
                  <span className="text-[13px] text-gray-400 italic">Repos</span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={save} disabled={saving || loading}
          className="h-10 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-[13px] rounded-xl flex items-center gap-2 transition-colors shadow-sm shadow-blue-200"
        >
          <CheckCircle2 size={14}/> {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
