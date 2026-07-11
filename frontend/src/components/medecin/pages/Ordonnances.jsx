import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FileText, Search, CalendarDays, Pill, Image } from "lucide-react";

export default function MedecinOrdonnances() {
  const [ordonnances, setOrdonnances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  const token  = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    fetch(`http://localhost:5000/api/ordonnances/medecin/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(setOrdonnances)
      .finally(() => setLoading(false));
  }, []);

  const filtered = ordonnances.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (o.patient?.user?.nom || "").toLowerCase().includes(q) || (o.notes || "").toLowerCase().includes(q);
  });

  const fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";

  const texte  = ordonnances.filter(o => o.medicaments?.length).length;
  const photos = ordonnances.filter(o => o.fichier).length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
          <FileText size={20} className="text-blue-600" /> Ordonnances
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{ordonnances.length} ordonnance{ordonnances.length !== 1 ? "s" : ""} émise{ordonnances.length !== 1 ? "s" : ""}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",  val: ordonnances.length, bg: "bg-blue-50",    num: "text-blue-700"   },
          { label: "Texte",  val: texte,              bg: "bg-emerald-50", num: "text-emerald-700" },
          { label: "Photo",  val: photos,             bg: "bg-purple-50",  num: "text-purple-700"  },
        ].map(({ label, val, bg, num }) => (
          <div key={label} className={`${bg} border border-gray-100 rounded-2xl p-4`}>
            <div className={`text-[26px] font-extrabold leading-none mb-1 ${num}`}>{loading ? "—" : val}</div>
            <div className="text-[11px] text-gray-500 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input
          className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
          placeholder="Rechercher par patient ou notes…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Liste */}
      {loading && <div className="text-center py-16 text-gray-400 text-sm">Chargement…</div>}

      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center">
          <FileText size={30} className="mx-auto text-gray-200 mb-3"/>
          <p className="text-[13px] text-gray-400">
            {ordonnances.length === 0 ? "Aucune ordonnance émise." : "Aucun résultat."}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((o, i) => {
          const isPhoto = !!o.fichier;
          const meds = o.medicaments || [];
          return (
            <motion.div key={o.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-sm hover:border-blue-200 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isPhoto ? "bg-purple-100" : "bg-emerald-100"}`}>
                  {isPhoto
                    ? <Image size={16} className="text-purple-600"/>
                    : <Pill size={16} className="text-emerald-600"/>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[14px] font-bold text-gray-900">{o.patient?.user?.nom || "—"}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isPhoto ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {isPhoto ? "Photo" : "Texte"}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <CalendarDays size={9}/> {fmtDate(o.date)}
                    </span>
                  </div>

                  {meds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {meds.map((m, j) => (
                        <span key={j} className="text-[11px] bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                          {m.nom}{m.dosage ? ` ${m.dosage}` : ""}
                        </span>
                      ))}
                    </div>
                  )}

                  {o.notes && <div className="text-[11px] text-gray-400 mt-1.5 italic">Notes : {o.notes}</div>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
