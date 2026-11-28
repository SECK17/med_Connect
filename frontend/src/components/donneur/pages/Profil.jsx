import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User, Mail, Phone, MapPin, Droplets, ToggleLeft, ToggleRight, CheckCircle2, Navigation, Loader2 } from "lucide-react";
import { API_URL } from "../../../config.js";
import DeconnexionPartout from "../../DeconnexionPartout.jsx";

export default function DonneurProfil() {
  const [profil,    setProfil]    = useState(null);
  const [userInfo,  setUserInfo]  = useState(null);
  const [dispo,     setDispo]     = useState(true);
  const [loading,   setLoading]   = useState(() => Boolean(sessionStorage.getItem("token") && sessionStorage.getItem("userId"))); // rien à charger si personne n'est connecté
  const [saved,     setSaved]     = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [coords,    setCoords]    = useState(null);

  const token  = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");
  const nom    = sessionStorage.getItem("nom")   || "Donneur";
  const email  = sessionStorage.getItem("email") || "";

  useEffect(() => {
    if (!token || !userId) return;
    fetch(`${API_URL}/api/patients/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setUserInfo(data);
          setDispo(data.profil_patient?.donneurDisponible !== false);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch(`${API_URL}/api/donneur/profil`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(p => { if (p) setProfil(p); })
      .catch(() => {});
  }, []);

  const partagerPosition = () => {
    if (!navigator.geolocation) { setGpsStatus("error"); return; }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async ({ coords: c }) => {
        setCoords({ lat: c.latitude, lng: c.longitude });
        await fetch(`${API_URL}/api/donneur/localisation`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ latitude: c.latitude, longitude: c.longitude }),
        }).catch(() => {});
        setGpsStatus("ok");
        setTimeout(() => setGpsStatus(null), 3000);
      },
      () => setGpsStatus("error"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const toggleDispo = async () => {
    const newDispo = !dispo;
    setDispo(newDispo);
    await fetch(`${API_URL}/api/donneur/disponibilite`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const groupe = profil?.groupe_sanguin || userInfo?.profil_patient?.groupeSanguin;
  const adresse = userInfo?.profil_patient?.adresse;
  const telephone = userInfo?.telephone;

  return (
    <div className="space-y-4">

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[22px] font-bold text-gray-900">Mon profil</h1>
        <p className="text-sm text-gray-500 mt-1">Vos informations de donneur</p>
      </motion.div>

      {/* Carte identité */}
      <div className="bg-gradient-to-br from-red-600 to-red-500 rounded-2xl p-5 text-white shadow-lg shadow-red-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 text-[26px] font-black border-2 border-white/30">
            {groupe || (nom[0] || "D").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[17px] font-bold truncate">{nom}</div>
            <div className="text-[12px] text-white/70 truncate">{email}</div>
            {groupe && (
              <div className="text-[11px] text-white/60 mt-0.5">Groupe sanguin · {groupe}</div>
            )}
          </div>
        </div>

        {/* Toggle disponibilité */}
        <div className="mt-4 flex items-center justify-between bg-white/15 rounded-xl px-4 py-3 border border-white/20">
          <div>
            <div className="text-[13px] font-semibold">Disponibilité au don</div>
            <div className="text-[11px] text-white/60">Les hôpitaux peuvent vous contacter</div>
          </div>
          <button onClick={toggleDispo}
            className={`flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-xl border transition-all ${
              dispo
                ? "bg-white text-red-600 border-white shadow-sm"
                : "bg-white/20 text-white/70 border-white/30"
            }`}>
            {dispo ? <><ToggleRight size={15} /> Disponible</> : <><ToggleLeft size={15} /> Indisponible</>}
          </button>
        </div>

        {saved && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/80">
            <CheckCircle2 size={12} /> Statut mis à jour
          </div>
        )}
      </div>

      {/* Informations personnelles */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <div className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">Informations</div>

        {loading ? (
          <div className="py-4 text-center text-sm text-gray-400">Chargement…</div>
        ) : (
          <div className="space-y-2">
            {[
              { icon: User,    label: "Nom",           val: nom      },
              { icon: Mail,    label: "Email",          val: email    },
              { icon: Phone,   label: "Téléphone",      val: telephone || "—" },
              { icon: MapPin,  label: "Adresse",        val: adresse   || "—" },
              { icon: Droplets,label: "Groupe sanguin", val: groupe    || "—", highlight: !!groupe },
            ].map(({ icon: Icon, label, val, highlight }) => (
              <div key={label} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${highlight ? "bg-red-50 border border-red-100" : "bg-gray-50"}`}>
                <Icon size={15} className={highlight ? "text-red-500 flex-shrink-0" : "text-gray-400 flex-shrink-0"} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-gray-400">{label}</div>
                  <div className={`text-[13px] font-semibold truncate ${highlight ? "text-red-700 text-[16px] font-black" : "text-gray-900"}`}>{val}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Localisation */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Localisation</div>
        <p className="text-[12px] text-gray-500 mb-3">
          Partagez votre position pour recevoir uniquement les alertes dans votre zone. Votre position n'est jamais affichée publiquement.
        </p>
        <button onClick={partagerPosition} disabled={gpsStatus === "loading"}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors border ${
            gpsStatus === "ok"
              ? "bg-green-50 text-green-700 border-green-200"
              : gpsStatus === "error"
              ? "bg-red-50 text-red-600 border-red-200"
              : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          }`}
        >
          {gpsStatus === "loading"
            ? <Loader2 size={14} className="animate-spin" />
            : <Navigation size={14} />
          }
          {gpsStatus === "ok"    ? "Position enregistrée ✓"
           : gpsStatus === "error" ? "Erreur — Réessayer"
           : coords               ? "Mettre à jour ma position"
           : "Partager ma position"}
        </button>
        {coords && gpsStatus !== "error" && (
          <p className="text-[11px] text-gray-400 mt-1.5">
            {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </p>
        )}
      </div>

      {/* Prochain don */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="text-[13px] font-bold text-amber-800 mb-1">Prochain don possible</div>
        <div className="text-[12px] text-amber-700">
          Un intervalle de <strong>56 jours</strong> est recommandé entre deux dons de sang total.
        </div>
      </div>

      {/* Déconnexion de tous les appareils */}
      <DeconnexionPartout />
    </div>
  );
}
