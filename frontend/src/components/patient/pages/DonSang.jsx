import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Droplets, AlertTriangle, MapPin, Building2, Heart,
  CheckCircle2, ToggleLeft, ToggleRight, Star, ArrowRight, ArrowLeft, Phone, X,
} from "lucide-react";

const URGENCY_STYLE = {
  "Critique": { cls: "bg-red-50 border-red-300",      badge: "bg-red-100 text-red-700",      icon: "text-red-600"    },
  "Haute":    { cls: "bg-orange-50 border-orange-200", badge: "bg-orange-100 text-orange-700", icon: "text-orange-500" },
  "Moyenne":  { cls: "bg-yellow-50 border-yellow-200", badge: "bg-yellow-100 text-yellow-700", icon: "text-yellow-600" },
};


const COMPATIBILITE = {
  "O-":  { donneA: ["O-","O+","A-","A+","B-","B+","AB-","AB+"], recoit: ["O-"],                           label: "Donneur universel" },
  "O+":  { donneA: ["O+","A+","B+","AB+"],                      recoit: ["O-","O+"],                      label: "" },
  "A-":  { donneA: ["A-","A+","AB-","AB+"],                     recoit: ["O-","A-"],                      label: "" },
  "A+":  { donneA: ["A+","AB+"],                                recoit: ["O-","O+","A-","A+"],             label: "" },
  "B-":  { donneA: ["B-","B+","AB-","AB+"],                     recoit: ["O-","B-"],                      label: "" },
  "B+":  { donneA: ["B+","AB+"],                                recoit: ["O-","O+","B-","B+"],             label: "" },
  "AB-": { donneA: ["AB-","AB+"],                               recoit: ["O-","A-","B-","AB-"],            label: "" },
  "AB+": { donneA: ["AB+"],                                     recoit: ["O-","O+","A-","A+","B-","B+","AB-","AB+"], label: "Receveur universel" },
};

export default function DonSang() {
  const [tab, setTab]         = useState("alertes");
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess]     = useState(false);
  const [monStatut, setMonStatut] = useState(null);
  const [contactModal, setContactModal] = useState(null);
  const [mesReponses, setMesReponses]   = useState(new Set());

  const token  = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

  const profil    = JSON.parse(localStorage.getItem("medconnect_profile") || "{}");
  const monGroupe = profil.bloodGroup || "";

  const fetchAlertesPatient = async (groupePat) => {
    const headers = { Authorization: `Bearer ${token}` };
    const res = await fetch("http://localhost:5000/api/alertes-sang/patient", { headers });
    if (!res.ok) return;
    const alertesData = await res.json();
    setAlerts(alertesData);

    if (groupePat) {
      const seenKey = "medconnect_patient_alertes_seen";
      const seen = new Set(JSON.parse(localStorage.getItem(seenKey) || "[]"));
      const nouvelles = alertesData.filter(a =>
        !seen.has(a.id) && Array.isArray(a.groupes_donneurs) && a.groupes_donneurs.includes(groupePat)
      );
      if (nouvelles.length > 0) {
        const existing = JSON.parse(localStorage.getItem("medconnect_patient_notifications") || "[]");
        const newNotifs = nouvelles.map(a => ({
          title: `🩸 Besoin urgent — Groupe ${a.groupe_sang}`,
          message: `${a.hopital_nom} recherche des donneurs compatibles avec votre groupe ${groupePat}.`,
          type: "info",
          date: new Date().toISOString(),
          read: false,
        }));
        localStorage.setItem("medconnect_patient_notifications", JSON.stringify([...newNotifs, ...existing]));
        localStorage.setItem(seenKey, JSON.stringify([...seen, ...nouvelles.map(a => a.id)]));
      }
    }
  };

  useEffect(() => {
    const local = JSON.parse(localStorage.getItem("medconnect_donor_profile") || "null");
    if (local) setMonStatut(local);
    const groupePat = local?.groupe || monGroupe;

    const load = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        fetch("http://localhost:5000/api/alertes-sang/mes-reponses", { headers })
          .then(r => r.ok ? r.json() : [])
          .then(rep => setMesReponses(new Set(rep.map(r => r.alerte_id))))
          .catch(() => {});
        await fetchAlertesPatient(groupePat);
      } catch {}
      setLoading(false);
    };
    load();

    // Rafraîchissement automatique toutes les 30 secondes
    const interval = setInterval(() => {
      fetchAlertesPatient(groupePat).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const sInscrire = async () => {
    const nouvelleInscription = {
      nom: profil.name || "",
      groupe: monGroupe,
      ville: profil.address || "",
      telephone: profil.phone || "",
      disponible: true,
      dateInscription: new Date().toISOString(),
    };
    if (token) {
      fetch("http://localhost:5000/api/donneur/inscription", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ groupe: monGroupe }),
      }).catch(() => {});
    }
    localStorage.setItem("medconnect_donor_profile", JSON.stringify(nouvelleInscription));
    setMonStatut(nouvelleInscription);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setTab("alertes"); }, 2000);
  };

  const toggleDisponible = async () => {
    const updated = { ...monStatut, disponible: !monStatut.disponible };
    localStorage.setItem("medconnect_donor_profile", JSON.stringify(updated));
    setMonStatut(updated);
    if (token) {
      fetch("http://localhost:5000/api/donneur/disponibilite", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  };

  // Alertes prioritaires = celles qui correspondent au groupe du patient ou de son statut donneur
  const groupePrioritaire = monStatut?.groupe || monGroupe;
  const alertesPrioritaires = alerts.filter(a =>
    groupePrioritaire && Array.isArray(a.groupes_donneurs) && a.groupes_donneurs.includes(groupePrioritaire)
  );
  const alertesAutres = alerts.filter(a =>
    !groupePrioritaire || !Array.isArray(a.groupes_donneurs) || !a.groupes_donneurs.includes(groupePrioritaire)
  );
  const alertesTriees = [...alertesPrioritaires, ...alertesAutres];

  const compat = groupePrioritaire ? COMPATIBILITE[groupePrioritaire] : null;

  const formatDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-5 pb-4">

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Droplets size={20} className="text-red-600" /> Don de sang
        </h1>
        <p className="text-sm text-gray-500 mt-1">Consultez les besoins et enregistrez-vous comme donneur</p>
      </motion.div>

      {/* ── MON PROFIL DONNEUR (si inscrit) ── */}
      <AnimatePresence>
        {monStatut && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-gradient-to-br from-red-600 to-red-500 rounded-2xl p-5 text-white shadow-lg shadow-red-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                {/* Badge groupe sanguin */}
                <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-2xl font-black text-white">{monStatut.groupe}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[15px] font-bold">{monStatut.nom}</span>
                    {compat?.label && (
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <Star size={9} /> {compat.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-white/75 text-[12px]">
                    <MapPin size={11} /> {monStatut.ville}
                  </div>
                  {monStatut.dateInscription && (
                    <div className="text-white/60 text-[11px] mt-0.5">
                      Inscrit le {formatDate(monStatut.dateInscription)}
                    </div>
                  )}
                </div>
              </div>

              {/* Toggle disponibilité */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <button
                  onClick={toggleDisponible}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all border ${
                    monStatut.disponible
                      ? "bg-white text-red-600 border-white shadow-sm"
                      : "bg-white/20 text-white/80 border-white/30"
                  }`}
                >
                  {monStatut.disponible
                    ? <><ToggleRight size={15} /> Disponible</>
                    : <><ToggleLeft size={15} /> Indisponible</>
                  }
                </button>
                <span className="text-[10px] text-white/50">Appuyez pour changer</span>
              </div>
            </div>

            {/* Compatibilité rapide */}
            {compat && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="bg-white/15 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-white/70 text-[10px] font-semibold uppercase tracking-wide mb-2">
                    <ArrowRight size={10} /> Je peux donner à
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {compat.donneA.map(g => (
                      <span key={g} className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-lg">{g}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-white/15 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-white/70 text-[10px] font-semibold uppercase tracking-wide mb-2">
                    <ArrowLeft size={10} /> Je peux recevoir de
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {compat.recoit.map(g => (
                      <span key={g} className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-lg">{g}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TABS ── */}
      <div className="flex border-b border-gray-200">
        {[
          ["alertes",     Droplets, "Alertes"],
          ["inscription", Heart,    monStatut ? "Mon inscription" : "Devenir donneur"],
        ].map(([k, Icon, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
              tab === k ? "text-red-600 border-red-500" : "text-gray-500 border-transparent hover:text-gray-800"
            }`}
          >
            <Icon size={13} /> {l}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── ALERTES ── */}
        {tab === "alertes" && (
          <motion.div key="alertes" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">

            {/* Bannière prioritaire si mon groupe est recherché */}
            {alertesPrioritaires.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 bg-red-600 text-white px-4 py-3 rounded-xl"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[13px] font-black">{groupePrioritaire}</span>
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-bold">Votre groupe sanguin est recherché !</div>
                  <div className="text-[11px] text-white/75">
                    {alertesPrioritaires.length} alerte{alertesPrioritaires.length > 1 ? "s" : ""} urgente{alertesPrioritaires.length > 1 ? "s" : ""} pour le groupe {groupePrioritaire}
                  </div>
                </div>
                <AlertTriangle size={18} className="text-white/80 flex-shrink-0" />
              </motion.div>
            )}

            {/* Message si aucune alerte */}
            {alerts.length === 0 && !loading && groupePrioritaire && (
              <div className="bg-white border border-gray-200 rounded-xl py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-black text-red-400">{groupePrioritaire}</span>
                </div>
                <p className="text-sm text-gray-500 font-medium">Aucune alerte active pour le moment</p>
                <p className="text-[12px] text-gray-400 mt-1">Vous serez notifié en cas de besoin urgent</p>
              </div>
            )}

            {alerts.length === 0 && !loading && !groupePrioritaire && (
              <div className="bg-white border border-gray-200 rounded-xl py-10 text-center text-sm text-gray-400">
                <Droplets size={32} className="mx-auto text-red-200 mb-2" />
                Aucune alerte de don de sang active.
              </div>
            )}

            {/* Liste des alertes triées (prioritaires en premier) */}
            {alertesTriees.map((a, i) => {
              const urgLabel = a.urgence === "Critique" ? "Critique" : a.urgence === "Urgent" ? "Haute" : "Moyenne";
              const style = URGENCY_STYLE[urgLabel] || URGENCY_STYLE["Moyenne"];
              const isPrioritaire = groupePrioritaire &&
                Array.isArray(a.groupes_donneurs) && a.groupes_donneurs.includes(groupePrioritaire);
              return (
                <motion.div key={a.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`border rounded-xl p-4 ${style.cls} ${isPrioritaire ? "ring-2 ring-red-400 ring-offset-1" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center flex-shrink-0 border border-white shadow-sm">
                      <span className={`text-xl font-black ${style.icon}`}>{a.groupe_sang}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <div className="text-[14px] font-semibold text-gray-900 flex items-center gap-1.5">
                          <Building2 size={13} /> {a.hopital_nom}
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                          {a.urgence}
                        </span>
                        {isPrioritaire && (
                          <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                            Votre groupe
                          </span>
                        )}
                      </div>
                      {a.message && (
                        <div className="text-[12px] text-gray-600 mb-1">{a.message}</div>
                      )}
                      <div className="text-[11px] text-gray-500 flex items-center gap-1">
                        <MapPin size={9}/> {a.hopital?.ville || "Dakar"}
                      </div>
                    </div>
                  </div>
                  {isPrioritaire && (
                    <button
                      onClick={() => {
                        // Traçabilité
                        if (token) {
                          fetch(`http://localhost:5000/api/alertes-sang/${a.id}/repondre`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                          }).catch(() => {});
                          setMesReponses(prev => new Set([...prev, a.id]));
                        }
                        setContactModal({
                          hopital_nom: a.hopital_nom,
                          telephone: a.hopital?.telephone,
                          adresse: a.hopital?.adresse,
                          groupe_sang: a.groupe_sang,
                          distance_km: a.distance_km,
                        });
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold rounded-xl transition-colors"
                    >
                      <Heart size={13}/> {mesReponses.has(a.id) ? "Recontacter l'hôpital" : "Je peux donner"}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ── INSCRIPTION ── */}
        {tab === "inscription" && (
          <motion.div key="inscription" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Infos du profil en lecture seule */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">Vos informations</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-[11px] text-gray-400 mb-0.5">Nom</div>
                  <div className="text-[13px] font-semibold text-gray-900">{profil.name || "—"}</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <div className="text-[11px] text-gray-400 mb-0.5">Groupe sanguin</div>
                  <div className="text-[18px] font-black text-red-600">{monGroupe || "—"}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-[11px] text-gray-400 mb-0.5">Téléphone</div>
                  <div className="text-[13px] font-semibold text-gray-900">{profil.phone || "—"}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-[11px] text-gray-400 mb-0.5">Adresse</div>
                  <div className="text-[13px] font-semibold text-gray-900">{profil.address || "—"}</div>
                </div>
              </div>
            </div>

            {/* Message succès */}
            <AnimatePresence>
              {success && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-[13px] px-4 py-3 rounded-xl"
                >
                  <CheckCircle2 size={15} /> Vous êtes maintenant enregistré comme donneur !
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bouton principal */}
            {monStatut ? (
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-semibold text-gray-900">Statut donneur</div>
                    <div className="text-[12px] text-gray-400">Inscrit le {formatDate(monStatut.dateInscription)}</div>
                  </div>
                  <button
                    onClick={toggleDisponible}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all border ${
                      monStatut.disponible
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    {monStatut.disponible
                      ? <><ToggleRight size={16} /> Disponible</>
                      : <><ToggleLeft size={16} /> Indisponible</>
                    }
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">Appuyez sur le bouton pour changer votre disponibilité.</p>
              </div>
            ) : (
              <button
                onClick={sInscrire}
                disabled={!monGroupe}
                className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 text-[15px] transition-colors shadow-sm shadow-red-200"
              >
                <Heart size={16} /> Devenir donneur de sang
              </button>
            )}

            {!monGroupe && (
              <p className="text-[12px] text-center text-gray-400">
                Renseignez votre groupe sanguin dans votre profil pour pouvoir vous inscrire.
              </p>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── MODAL CONTACT HÔPITAL ── */}
      <AnimatePresence>
        {contactModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[900]"
              onClick={() => setContactModal(null)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[901] px-5 pt-5 pb-8 max-w-lg mx-auto shadow-2xl"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

              {/* Groupe badge */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                  <span className="text-[22px] font-black text-red-600">{contactModal.groupe_sang}</span>
                </div>
                <div>
                  <div className="text-[16px] font-bold text-gray-900">{contactModal.hopital_nom}</div>
                  <div className="text-[12px] text-red-600 font-medium">Besoin urgent de donneurs</div>
                </div>
                <button
                  onClick={() => setContactModal(null)}
                  className="ml-auto w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <X size={14} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                {contactModal.telephone && (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <Phone size={16} className="text-red-500 flex-shrink-0" />
                    <div>
                      <div className="text-[11px] text-gray-400 uppercase tracking-wide">Téléphone</div>
                      <div className="text-[14px] font-semibold text-gray-900">{contactModal.telephone}</div>
                    </div>
                  </div>
                )}
                {contactModal.adresse && (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <MapPin size={16} className="text-red-500 flex-shrink-0" />
                    <div>
                      <div className="text-[11px] text-gray-400 uppercase tracking-wide">Adresse</div>
                      <div className="text-[14px] font-semibold text-gray-900">{contactModal.adresse}</div>
                    </div>
                  </div>
                )}
              </div>

              {contactModal.telephone ? (
                <a
                  href={`tel:${contactModal.telephone}`}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl text-[15px] transition-colors"
                >
                  <Phone size={16} /> Appeler maintenant
                </a>
              ) : (
                <div className="text-center text-[13px] text-gray-400">
                  Aucun contact disponible — rendez-vous directement à l'hôpital.
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

