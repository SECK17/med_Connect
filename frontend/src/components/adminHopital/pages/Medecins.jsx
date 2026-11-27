import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Stethoscope, Search, CheckCircle2, Clock, Phone, Mail, X } from "lucide-react";
import { API_URL } from "../../../config.js";

export default function AdminHopitalMedecins() {
  const [medecins, setMedecins] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [toast,    setToast]    = useState(null);
  const [acting,   setActing]   = useState(null);
  const token = sessionStorage.getItem("token");

  const load = () => {
    setLoading(true);
    fetch(`${API_URL}/api/admin-hopital/medecins`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(setMedecins)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const action = async (medecinId, route) => {
    setActing(medecinId + route);
    try {
      const res = await fetch(`${API_URL}/api/admin-hopital/medecins/${medecinId}/${route}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (res.ok) { showToast(d.message); load(); }
      else showToast(d.message || "Erreur", "error");
    } catch { showToast("Erreur réseau", "error"); }
    finally { setActing(null); }
  };

  const filtered = medecins.filter(m =>
    m.nom.toLowerCase().includes(search.toLowerCase()) ||
    (m.specialite || "").toLowerCase().includes(search.toLowerCase())
  );

  const valides   = medecins.filter(m =>  m.valide).length;
  const enAttente = medecins.filter(m => !m.valide).length;

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold border ${
          toast.type === "error"
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-emerald-50 border-emerald-200 text-emerald-800"
        }`}>
          {toast.type === "error" ? <X size={13}/> : <CheckCircle2 size={13}/>}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
          <Stethoscope size={20} className="text-rose-500" /> Médecins de l'hôpital
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {medecins.length} médecin{medecins.length !== 1 ? "s" : ""} rattaché{medecins.length !== 1 ? "s" : ""} à votre établissement
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",      val: medecins.length, bg: "bg-gray-50",    num: "text-gray-700"    },
          { label: "Validés",    val: valides,         bg: "bg-emerald-50", num: "text-emerald-700" },
          { label: "En attente", val: enAttente,       bg: "bg-amber-50",   num: "text-amber-700"   },
        ].map(({ label, val, bg, num }) => (
          <div key={label} className={`${bg} border border-gray-100 rounded-2xl p-4`}>
            <div className={`text-[26px] font-extrabold leading-none mb-1 ${num}`}>{loading ? "—" : val}</div>
            <div className="text-[11px] text-gray-500 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 bg-white"
          placeholder="Rechercher par nom ou spécialité…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Liste */}
      {loading && <div className="text-center py-16 text-gray-400 text-sm">Chargement…</div>}

      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
          <Stethoscope size={30} className="mx-auto text-gray-200 mb-3" />
          <p className="text-[13px] text-gray-400">
            {medecins.length === 0
              ? "Aucun médecin n'est encore rattaché à votre hôpital."
              : "Aucun résultat pour cette recherche."}
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((m, i) => (
          <motion.div key={m.id}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-sm hover:border-rose-200 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[16px] flex items-center justify-center flex-shrink-0">
                {(m.nom || "M")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-bold text-gray-900">{m.nom}</span>
                  {m.valide
                    ? <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                        <CheckCircle2 size={9} /> Validé
                      </span>
                    : <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        <Clock size={9} /> En attente
                      </span>
                  }
                </div>
                {m.specialite && m.specialite !== "—" && (
                  <div className="text-[11px] text-rose-600 font-semibold mt-0.5">{m.specialite}</div>
                )}
                <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                  <Mail size={9} /> {m.email}
                </div>
                {m.telephone && m.telephone !== "—" && (
                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Phone size={9} /> {m.telephone}
                  </div>
                )}

                {/* Boutons validation (uniquement si non validé) */}
                {!m.valide && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => action(m.id, "valider")}
                      disabled={acting === m.id + "valider"}
                      className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <CheckCircle2 size={11} />
                      {acting === m.id + "valider" ? "…" : "Valider"}
                    </button>
                    <button
                      onClick={() => action(m.id, "rejeter")}
                      disabled={acting === m.id + "rejeter"}
                      className="flex-1 h-8 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 border border-red-200 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <X size={11} />
                      {acting === m.id + "rejeter" ? "…" : "Rejeter"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
