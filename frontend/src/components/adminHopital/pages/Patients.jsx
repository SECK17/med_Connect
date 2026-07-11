import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { UserRound, Search, Mail, Phone, CalendarDays, Stethoscope } from "lucide-react";

export default function AdminHopitalPatients() {
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:5000/api/admin-hopital/patients", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(setPatients)
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    return !q || p.nom?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q);
  });

  const fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";

  return (
    <div className="space-y-5">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
          <UserRound size={20} className="text-rose-500" /> Patients de l'hôpital
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {patients.length} patient{patients.length !== 1 ? "s" : ""} ayant eu un rendez-vous dans votre établissement
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4">
          <div className="text-[26px] font-extrabold text-sky-700 leading-none mb-1">{loading ? "—" : patients.length}</div>
          <div className="text-[11px] text-gray-500 font-medium">Total patients</div>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
          <div className="text-[26px] font-extrabold text-rose-600 leading-none mb-1">
            {loading ? "—" : patients.filter(p => {
              const d = new Date(p.dernier_rdv);
              const now = new Date();
              return (now - d) / (1000 * 60 * 60 * 24) <= 30;
            }).length}
          </div>
          <div className="text-[11px] text-gray-500 font-medium">RDV ce mois-ci</div>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input
          className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 bg-white"
          placeholder="Rechercher par nom ou email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Liste */}
      {loading && <div className="text-center py-16 text-gray-400 text-sm">Chargement…</div>}

      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center">
          <UserRound size={30} className="mx-auto text-gray-200 mb-3"/>
          <p className="text-[13px] text-gray-400">
            {patients.length === 0
              ? "Aucun patient n'a encore consulté dans votre hôpital."
              : "Aucun résultat pour cette recherche."}
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((p, i) => (
          <motion.div key={p.id}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-sm hover:border-sky-200 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-sky-100 text-sky-700 font-extrabold text-[16px] flex items-center justify-center flex-shrink-0">
                {(p.nom || "P")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-gray-900">{p.nom}</div>
                <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                  <Mail size={9}/> {p.email}
                </div>
                {p.telephone && p.telephone !== "—" && (
                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Phone size={9}/> {p.telephone}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <CalendarDays size={9} className="text-rose-400"/> Dernier RDV : {fmtDate(p.dernier_rdv)}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Stethoscope size={9} className="text-emerald-500"/> Dr. {p.medecin}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
