import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Droplets, Bell, CheckCircle2, AlertTriangle, Heart,
  ChevronDown, ChevronUp, Info, Loader2, Phone, MapPin, X, Building2, Navigation,
} from "lucide-react";
import { API_URL } from "../../../config.js";

const URGENCE_CFG = {
  Critique: { bg: "bg-red-100",    text: "text-red-700",    border: "border-red-200",    dot: "bg-red-500",    label: "CRITIQUE" },
  Urgent:   { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500", label: "URGENT"   },
  Moyen:    { bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-400",  label: "MOYEN"    },
  Faible:   { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-400",   label: "FAIBLE"   },
};

const TIPS = [
  { icon: "😴", title: "Dormir suffisamment", text: "Un bon repos facilite la récupération après le don." },
  { icon: "🍽️", title: "Bien manger",         text: "Mangez un repas équilibré avant le don — jamais à jeun." },
  { icon: "💧", title: "S'hydrater",          text: "Buvez beaucoup d'eau avant et après votre don." },
  { icon: "🚫", title: "Éviter l'alcool",     text: "Évitez toute boisson alcoolisée 24h avant le don." },
];

const FAQ = [
  { q: "Le don est-il dangereux ?",        r: "Non. C'est un acte rapide, sécurisé et surveillé par du personnel médical qualifié." },
  { q: "Combien de temps dure un don ?",   r: "Entre 8 et 15 minutes pour la collecte, avec un temps total d'environ 30 minutes." },
  { q: "Puis-je donner plusieurs fois ?",  r: "Oui. Il faut simplement respecter le délai recommandé entre deux dons (environ 56 jours)." },
  { q: "Vais-je recevoir un certificat ?", r: "Oui, un certificat de don vous est remis à la fin de la procédure dans la plupart des centres." },
];

export default function DonneurDonSang() {
  // Heure de référence pour savoir si une alerte est expirée (lue une fois, au chargement de la page)
  const [maintenant] = useState(() => Date.now());
  const [alertes,      setAlertes]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [profil,       setProfil]       = useState(null);
  const [openFaq,      setOpenFaq]      = useState(null);
  const [contactModal, setContactModal] = useState(null);
  const [mesReponses,  setMesReponses]  = useState(new Set());
  const [historique,   setHistorique]   = useState([]);

  const token  = sessionStorage.getItem("token");

  const fetchAlertes = () =>
    fetch(`${API_URL}/api/alertes-sang/donneur`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() : []).catch(() => []);

  useEffect(() => {
    Promise.all([
      fetchAlertes(),
      fetch(`${API_URL}/api/donneur/profil`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_URL}/api/alertes-sang/mes-reponses`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([al, pr, rep]) => {
      setAlertes(al);
      setProfil(pr);
      setMesReponses(new Set(rep.map(r => r.alerte_id)));
      setHistorique(rep);
      setLoading(false);
    });

    // Rafraîchissement automatique toutes les 30 secondes
    const interval = setInterval(() => {
      fetchAlertes().then(al => setAlertes(al));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const repondre = async (alerte) => {
    // Enregistrer la réponse côté backend (traçabilité)
    fetch(`${API_URL}/api/alertes-sang/${alerte.id}/repondre`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    setMesReponses(prev => new Set([...prev, alerte.id]));
    // Ouvrir le modal de contact
    setContactModal({
      hopital_nom: alerte.hopital_nom,
      groupe_sang: alerte.groupe_sang,
      telephone:   alerte.hopital?.telephone,
      adresse:     alerte.hopital?.adresse,
      ville:       alerte.hopital?.ville,
      distance_km: alerte.distance_km,
    });
  };

  const alertesActives = alertes.filter(a => a.statut === "active");

  return (
    <div className="space-y-6">

      {/* ── Hero ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 via-rose-500 to-red-400 p-6 text-white shadow-lg shadow-rose-200"
      >
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Droplets size={14} className="text-white/70" />
              <span className="text-[12px] text-white/70 font-medium">Don de sang</span>
            </div>
            <h1 className="text-[22px] font-extrabold tracking-tight">Alertes de don</h1>
            <p className="text-white/60 text-[12px] mt-1">
              Vous recevez uniquement les alertes compatibles avec votre groupe sanguin.
            </p>
          </div>
          {profil?.groupe_sanguin && (
            <div className="flex-shrink-0 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center border border-white/30">
              <span className="text-[18px] font-extrabold text-white">{profil.groupe_sanguin}</span>
              <span className="text-[9px] text-white/60 font-semibold uppercase tracking-wide">Mon groupe</span>
            </div>
          )}
        </div>
        <div className="relative flex gap-4 mt-5">
          {[
            { label: "Alertes actives", val: loading ? "—" : alertesActives.length },
            { label: "Total reçues",    val: loading ? "—" : alertes.length        },
            { label: "Mes réponses",    val: loading ? "—" : mesReponses.size      },
          ].map(({ label, val }) => (
            <div key={label} className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
              <div className="text-[20px] font-extrabold text-white">{val}</div>
              <div className="text-[10px] text-white/60 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Alertes ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bell size={15} className="text-rose-500" />
          <h2 className="text-[15px] font-bold text-gray-900">Appels aux donneurs</h2>
          {alertesActives.length > 0 && (
            <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {alertesActives.length} active{alertesActives.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading && (
          <div className="bg-white border border-gray-200 rounded-xl py-12 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        )}

        {!loading && alertesActives.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white border border-gray-200 rounded-xl py-14 text-center"
          >
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart size={24} className="text-rose-200" />
            </div>
            <p className="text-[14px] font-semibold text-gray-600">Aucune alerte en ce moment</p>
            <p className="text-[12px] text-gray-400 mt-1">
              Vous serez notifié dès qu'un hôpital a besoin d'un donneur compatible.
            </p>
          </motion.div>
        )}

        <div className="space-y-3">
          <AnimatePresence>
            {alertesActives.map((a, i) => {
              const ucfg = URGENCE_CFG[a.urgence] || URGENCE_CFG.Moyen;
              const dejaRepondu = mesReponses.has(a.id);
              return (
                <motion.div key={a.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className={`bg-white border rounded-2xl p-5 shadow-sm ${a.urgence === "Critique" ? "border-red-200 shadow-red-50" : "border-gray-200"}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-rose-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border border-rose-200">
                      <Droplets size={14} className="text-rose-500 mb-0.5" />
                      <span className="text-[15px] font-extrabold text-rose-700">{a.groupe_sang}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[14px] font-bold text-gray-900">{a.hopital_nom || "Hôpital"}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${ucfg.bg} ${ucfg.text} ${ucfg.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${ucfg.dot}`} /> {ucfg.label}
                        </span>
                        {dejaRepondu && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                            <CheckCircle2 size={9} /> Répondu
                          </span>
                        )}
                      </div>
                      {a.quantite && (
                        <div className="text-[12px] text-gray-600 mb-0.5">
                          Quantité demandée : <span className="font-semibold">{a.quantite}</span>
                        </div>
                      )}
                      {a.message && (
                        <div className="text-[12px] text-gray-500 italic mb-1">"{a.message}"</div>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                        <span>Lancée le {new Date(a.created_at || a.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</span>
                        {a.distance_km != null && (
                          <span className="flex items-center gap-0.5 text-rose-500 font-semibold">
                            <Navigation size={10} /> {a.distance_km} km
                          </span>
                        )}
                        {a.rayon_km && (
                          <span className="text-gray-300">Zone : {a.rayon_km} km</span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <button
                        onClick={() => repondre(a)}
                        className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl transition-colors shadow-sm ${
                          dejaRepondu
                            ? "bg-green-50 text-green-700 border border-green-200 shadow-green-50"
                            : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200"
                        }`}
                      >
                        <Heart size={13} /> {dejaRepondu ? "Recontacter" : "Je peux donner"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Conseils + Conditions ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <Info size={14} className="text-blue-500" />
            <h3 className="text-[14px] font-bold text-gray-900">Avant de donner</h3>
          </div>
          <div className="p-4 space-y-3">
            {TIPS.map(tip => (
              <div key={tip.title} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <span className="text-[20px] flex-shrink-0">{tip.icon}</span>
                <div>
                  <div className="text-[13px] font-semibold text-gray-800">{tip.title}</div>
                  <div className="text-[12px] text-gray-500 mt-0.5">{tip.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <h3 className="text-[14px] font-bold text-gray-900">Conditions requises</h3>
          </div>
          <div className="p-4 space-y-2.5">
            {[
              "Être en bonne santé générale",
              "Avoir au moins 18 ans",
              "Peser au moins 50 kg",
              "Ne pas souffrir d'une maladie contagieuse",
              "Respecter le délai de 56 jours entre deux dons",
              "Ne pas avoir consommé d'alcool dans les 24h",
            ].map(cond => (
              <div key={cond} className="flex items-start gap-2.5">
                <div className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 size={10} className="text-emerald-600" />
                </div>
                <span className="text-[13px] text-gray-700">{cond}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Historique de mes réponses ── */}
      {historique.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <CheckCircle2 size={14} className="text-rose-500" />
            <h3 className="text-[14px] font-bold text-gray-900">Mes réponses passées</h3>
            <span className="ml-auto text-[11px] font-semibold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
              {historique.length}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {historique.map((r, i) => {
              const estExpiree = r.expire_at && new Date(r.expire_at) < maintenant;
              const statutCfg = (r.statut === "active" && estExpiree)
                ? { cls: "bg-amber-100 text-amber-700", label: "Expirée" }
                : r.statut === "active"
                ? { cls: "bg-green-100 text-green-700", label: "Active" }
                : r.statut === "terminee"
                ? { cls: "bg-gray-100 text-gray-500",  label: "Terminée" }
                : { cls: "bg-red-100 text-red-500",    label: "Annulée" };
              return (
                <motion.div key={i}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[13px] font-black text-rose-600">{r.groupe_sang}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-gray-900 truncate">
                      {r.hopital_nom || "Hôpital"}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      Répondu le {new Date(r.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statutCfg.cls}`}>
                    {statutCfg.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── FAQ ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <AlertTriangle size={14} className="text-amber-500" />
          <h3 className="text-[14px] font-bold text-gray-900">Questions fréquentes</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {FAQ.map((item, i) => (
            <div key={item.q}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-[13px] font-semibold text-gray-800">{item.q}</span>
                {openFaq === i
                  ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0" />
                  : <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />
                }
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <p className="px-5 pb-4 text-[12px] text-gray-500 leading-relaxed">{item.r}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* ── MODAL CONTACT HÔPITAL ── */}
      <AnimatePresence>
        {contactModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[900]"
              onClick={() => setContactModal(null)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[901] px-5 pt-5 pb-10 max-w-lg mx-auto shadow-2xl"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[22px] font-black text-red-600">{contactModal.groupe_sang}</span>
                </div>
                <div className="flex-1">
                  <div className="text-[16px] font-bold text-gray-900">{contactModal.hopital_nom}</div>
                  <div className="flex items-center gap-2">
                    <div className="text-[12px] text-red-600 font-medium">Besoin urgent de donneurs</div>
                    {contactModal.distance_km != null && (
                      <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                        <Navigation size={10} /> {contactModal.distance_km} km
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setContactModal(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
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
                      <div className="text-[14px] font-semibold text-gray-900">
                        {contactModal.adresse}{contactModal.ville ? `, ${contactModal.ville}` : ""}
                      </div>
                    </div>
                  </div>
                )}
                {!contactModal.telephone && !contactModal.adresse && (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 text-[13px] text-gray-400">
                    <Building2 size={16} className="flex-shrink-0" />
                    Rendez-vous directement à l'hôpital {contactModal.hopital_nom}.
                  </div>
                )}
              </div>

              {contactModal.telephone ? (
                <a href={`tel:${contactModal.telephone}`}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl text-[15px] transition-colors">
                  <Phone size={16} /> Appeler maintenant
                </a>
              ) : (
                <button onClick={() => setContactModal(null)}
                  className="w-full py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-2xl text-[14px]">
                  Fermer
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
