import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Users, Search, Mail, MapPin } from "lucide-react";
import { API_URL } from "../../../config.js";

const GROUPES = ["Tous","A+","A-","B+","B-","AB+","AB-","O+","O-"];
const GROUPE_COLOR = { "A+":"rose","A-":"rose","B+":"blue","B-":"blue","AB+":"violet","AB-":"violet","O+":"emerald","O-":"emerald" };

export default function AdminHopitalDonneurs() {
  const [donneurs, setDonneurs] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [groupe,   setGroupe]   = useState("Tous");
  const [search,   setSearch]   = useState("");
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_URL}/api/admin-hopital/donneurs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(setDonneurs)
      .finally(() => setLoading(false));
  }, []);

  const filtered = donneurs.filter(d =>
    (groupe === "Tous" || d.groupe === groupe) &&
    (d.nom.toLowerCase().includes(search.toLowerCase()) || (d.adresse || "").toLowerCase().includes(search.toLowerCase()))
  );

  const stats = GROUPES.slice(1).reduce((acc, g) => { acc[g] = donneurs.filter(d => d.groupe === g).length; return acc; }, {});

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
          <Users size={20} className="text-rose-500" /> Donneurs de sang
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{donneurs.length} donneur{donneurs.length !== 1 ? "s" : ""} enregistré{donneurs.length !== 1 ? "s" : ""}</p>
      </motion.div>

      {/* Répartition par groupe */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
        {GROUPES.slice(1).map(g => (
          <button key={g} onClick={() => setGroupe(g === groupe ? "Tous" : g)}
            className={`text-center py-2.5 rounded-xl border transition-all ${groupe === g ? "bg-rose-600 text-white border-rose-600 shadow-sm" : "bg-white border-gray-200 hover:border-rose-200"}`}
          >
            <div className={`text-[18px] font-extrabold ${groupe === g ? "text-white" : "text-gray-700"}`}>{stats[g] || 0}</div>
            <div className={`text-[10px] font-semibold ${groupe === g ? "text-white/80" : "text-gray-400"}`}>{g}</div>
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-rose-400"
            placeholder="Rechercher un donneur…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={groupe} onChange={e => setGroupe(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-rose-400">
          {GROUPES.map(g => <option key={g}>{g}</option>)}
        </select>
      </div>

      {loading && <div className="text-center py-16 text-gray-400 text-sm">Chargement…</div>}
      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl py-14 text-center">
          <Users size={28} className="mx-auto text-gray-200 mb-2" />
          <p className="text-[13px] text-gray-400">Aucun donneur trouvé</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map((d, i) => {
          const color = GROUPE_COLOR[d.groupe] || "gray";
          return (
            <motion.div key={d.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-full bg-${color}-100 text-${color}-700 font-bold text-[16px] flex items-center justify-center flex-shrink-0`}>
                {(d.nom || "D")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-gray-900">{d.nom}</div>
                <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                  <Mail size={9} /> {d.email}
                </div>
                {d.adresse && d.adresse !== "—" && (
                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                    <MapPin size={9} /> {d.adresse}
                  </div>
                )}
              </div>
              {d.groupe ? (
                <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center flex-shrink-0`}>
                  <span className={`text-[14px] font-extrabold text-${color}-700`}>{d.groupe}</span>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] text-gray-400 font-medium">N/A</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
