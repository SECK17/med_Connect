import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Search, Building2, Star, ChevronDown, MapPin, Stethoscope, CalendarPlus, Users } from "lucide-react";
import { API_URL } from "../../../config.js";
import { signalerErreur } from "../../../utils/erreurs.js";

const HOPITAUX_DAKAR = [
  "Hôpital Principal de Dakar",
  "CHU de Fann",
  "Hôpital Aristide Le Dantec",
  "Hôpital Général de Grand Yoff (HOGGY)",
  "Hôpital de Pikine",
  "Hôpital Abass Ndao",
  "Hôpital Roi Baudouin (Guédiawaye)",
  "Hôpital de Ouakam",
  "Polyclinique SUMA",
  "Clinique Pasteur",
];

const VILLE_MAP = {
  "Hôpital Principal de Dakar":           "Dakar",
  "CHU de Fann":                          "Dakar",
  "Hôpital Aristide Le Dantec":           "Dakar",
  "Hôpital Général de Grand Yoff (HOGGY)":"Dakar",
  "Hôpital de Pikine":                    "Pikine",
  "Hôpital Abass Ndao":                   "Dakar",
  "Hôpital Roi Baudouin (Guédiawaye)":    "Guédiawaye",
  "Hôpital de Ouakam":                    "Dakar",
  "Polyclinique SUMA":                    "Dakar",
  "Clinique Pasteur":                     "Dakar",
};

const VILLES   = ["Toutes", "Dakar", "Pikine", "Guédiawaye"];
const SPECIALITES = ["Tous","Généraliste","Cardiologue","Pédiatre","Neurologue","Gynécologue","Ophtalmologue","Dermatologue","Chirurgien","Dentiste","ORL","Psychiatre"];

export default function Medecins() {
  const navigate = useNavigate();
  const [search, setSearch]       = useState("");
  const [spec, setSpec]           = useState("Tous");
  const [ville, setVille]         = useState("Toutes");
  // Liste mise en cache sur cet appareil : affichée tout de suite, puis rafraîchie par l'API
  const [medecins, setMedecins]   = useState(() => JSON.parse(localStorage.getItem("medconnect_doctors") || "null") || []);
  const [loading, setLoading]     = useState(() => !localStorage.getItem("medconnect_doctors"));
  const [ouvert, setOuvert]       = useState(null); // hôpital ouvert
  const token = sessionStorage.getItem("token");

  const fetchMedecins = async () => {
    try {
      const res = await fetch(`${API_URL}/api/medecins`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(m => ({
          id: String(m.id),
          name: m.nom,
          specialty: m.specialite || "Généraliste",
          hospital: m.hopital || "",
          phone: m.telephone || "",
          rating: m.note || 0,
          nbEvals: m.nbEvals || 0,
        }));
        localStorage.setItem("medconnect_doctors", JSON.stringify(mapped));
        setMedecins(mapped);
      }
    } catch (err) { signalerErreur(err); }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fonction asynchrone : l'état n'est modifié qu'après la réponse de l'API
    fetchMedecins();
  }, []);

  // Hôpitaux filtrés par ville
  const hopitauxFiltres = HOPITAUX_DAKAR.filter(nom =>
    ville === "Toutes" || VILLE_MAP[nom] === ville
  );

  // Filtrer les médecins selon recherche + spécialité + ville
  const filteredMedecins = medecins.filter(m =>
    (spec === "Tous" || m.specialty === spec) &&
    (ville === "Toutes" || VILLE_MAP[m.hospital] === ville) &&
    (m.name.toLowerCase().includes(search.toLowerCase()) ||
     m.specialty.toLowerCase().includes(search.toLowerCase()) ||
     m.hospital.toLowerCase().includes(search.toLowerCase()))
  );

  const totalMedecins = filteredMedecins.length;
  const totalHopitaux = hopitauxFiltres.filter(nom => filteredMedecins.some(m => m.hospital === nom)).length;

  const toggle = (nom) => setOuvert(o => o === nom ? null : nom);

  return (
    <div className="space-y-5">
      {/* Titre */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Stethoscope size={20} className="text-blue-600" />
            Trouver un Médecin par Hôpital
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sélectionnez un hôpital pour voir ses spécialistes disponibles et planifier votre rendez-vous.
          </p>
        </div>
        {!loading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 text-[12px] font-semibold px-3 py-1.5 rounded-xl">
            {totalMedecins} médecin{totalMedecins !== 1 ? "s" : ""} trouvé{totalMedecins !== 1 ? "s" : ""} dans {totalHopitaux} établissement{totalHopitaux !== 1 ? "s" : ""}
          </div>
        )}
      </motion.div>

      {/* Filtres */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Rechercher par nom, spécialité, hôpital…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={spec}
            onChange={e => setSpec(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-500 bg-white"
          >
            {SPECIALITES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        {/* Filtre ville */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Ville :</span>
          {VILLES.map(v => (
            <button key={v} onClick={() => { setVille(v); setOuvert(null); }}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold border transition-all ${
                ville === v
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >{v}</button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="py-10 text-center text-sm text-gray-400">Chargement…</div>
      )}

      {/* Grille de cartes hôpitaux — style dashboard */}
      {!loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {hopitauxFiltres.map((nomHop, i) => {
              const medsHop = filteredMedecins.filter(m => m.hospital === nomHop);
              const isSelected = ouvert === nomHop;
              const hasMeds = medsHop.length > 0;

              return (
                <motion.div
                  key={nomHop}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => toggle(nomHop)}
                  className={`bg-white border rounded-xl p-4 transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
                    isSelected ? "border-blue-400 ring-2 ring-blue-100 shadow-md" : "border-gray-200"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                    isSelected ? "bg-blue-100" : "bg-blue-50"
                  }`}>
                    <Building2 size={18} className={isSelected ? "text-blue-600" : "text-blue-500"} />
                  </div>
                  <div className={`text-2xl font-bold leading-none mb-1 ${
                    hasMeds ? (isSelected ? "text-blue-600" : "text-gray-900") : "text-gray-300"
                  }`}>
                    {medsHop.length}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-700 leading-tight mb-0.5 line-clamp-2">
                    {nomHop}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                    <MapPin size={9} /> Dakar, Sénégal
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-[10px] font-medium ${hasMeds ? "text-blue-600" : "text-gray-300"}`}>
                      {hasMeds ? `${medsHop.length} médecin${medsHop.length > 1 ? "s" : ""}` : "Aucun médecin"}
                    </span>
                    <motion.div animate={{ rotate: isSelected ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={13} className="text-gray-400" />
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Médecins de l'hôpital sélectionné */}
          <AnimatePresence>
            {ouvert && (
              <motion.div
                key={ouvert}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-blue-200 rounded-xl overflow-hidden"
              >
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-blue-50">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 size={15} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-gray-900">{ouvert}</div>
                    <div className="text-[11px] text-gray-500">
                      {filteredMedecins.filter(m => m.hospital === ouvert).length} médecin(s) enregistré(s)
                    </div>
                  </div>
                </div>
                {filteredMedecins.filter(m => m.hospital === ouvert).length === 0 ? (
                  <div className="py-10 text-center px-5">
                    <Users size={32} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-[13px] text-gray-400 font-medium">Aucun médecin enregistré dans cet hôpital pour le moment.</p>
                    <p className="text-[11px] text-gray-300 mt-1">Les médecins apparaîtront ici une fois leur profil complété.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {filteredMedecins.filter(m => m.hospital === ouvert).map((m, j) => (
                      <motion.div key={m.id}
                        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: j * 0.05 }}
                        className="flex items-center gap-4 px-5 py-4"
                      >
                        <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 font-bold text-[15px] flex items-center justify-center flex-shrink-0">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-semibold text-gray-900">Dr. {m.name}</div>
                          <div className="text-[12px] text-blue-600 font-medium flex items-center gap-1 mt-0.5">
                            <Stethoscope size={10} /> {m.specialty}
                          </div>
                          {m.rating > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} size={10} className={s <= Math.round(m.rating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
                              ))}
                              <span className="text-[10px] text-gray-400 ml-0.5">{m.rating}/5 ({m.nbEvals})</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => navigate("/dashboard/patient/rendezvous", {
                            state: { medecinId: m.id, medecinNom: m.name, hopital: ouvert, specialite: m.specialty }
                          })}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
                        >
                          <CalendarPlus size={13} /> Prendre RDV
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {totalMedecins === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl py-12 text-center">
              <Users size={36} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Aucun médecin trouvé pour ces critères.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
