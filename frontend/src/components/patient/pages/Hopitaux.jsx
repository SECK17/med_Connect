import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Navigation, MapPin, X, Loader2, ChevronDown, SlidersHorizontal,
} from "lucide-react";
import L from "leaflet";

/* ── Palette ────────────────────────────────────────────────────── */
const BLUE = "#2563EB";

/* ── Config types ───────────────────────────────────────────────── */
const TYPES_PRESTATAIRE = ["Tous", "Hôpital", "CHU", "Clinique", "Cabinet", "Pharmacie", "Centre"];
const REGIONS           = ["Toutes", "Dakar", "Pikine", "Guédiawaye", "Rufisque", "Keur Massar", "Thiès"];
const isPriveByType     = (t) => ["Clinique", "Cabinet", "Pharmacie"].includes(t);

const TYPE_PIN = {
  "Hôpital":   "#EF4444",
  "CHU":       "#EF4444",
  "Clinique":  "#3B82F6",
  "Pharmacie": "#10B981",
  "Centre":    "#8B5CF6",
  "Cabinet":   "#F59E0B",
};

/* ── Données statiques ──────────────────────────────────────────── */
const DATA = [
  { id:"l1",  nom:"Hôpital Principal de Dakar",            type:"Hôpital",  adresse:"Av. Nelson Mandela, Dakar",              tel:"+221 33 839 50 50", lat:14.7167, lng:-17.4677 },
  { id:"l2",  nom:"Clinique Pasteur",                      type:"Clinique", adresse:"Rue Aimé Césaire, Dakar",                 tel:"+221 33 889 01 01", lat:14.7180, lng:-17.4700 },
  { id:"l3",  nom:"Pharmacie Centrale",                    type:"Pharmacie",adresse:"Place de l'Indépendance, Dakar",          tel:"+221 33 821 44 44", lat:14.7170, lng:-17.4660 },
  { id:"l4",  nom:"Centre de Santé Keur Massar",           type:"Centre",   adresse:"Keur Massar, Dakar",                      tel:"+221 77 234 56 78", lat:14.7520, lng:-17.3020 },
  { id:"l5",  nom:"Hôpital de Pikine",                     type:"Hôpital",  adresse:"Pikine, Dakar",                           tel:"+221 33 822 33 55", lat:14.7600, lng:-17.2800 },
  { id:"l6",  nom:"CHU de Fann",                           type:"CHU",      adresse:"CHU de Fann, Dakar",                      tel:"+221 33 889 38 00", lat:14.7150, lng:-17.4650 },
  { id:"l7",  nom:"Polyclinique SUMA",                     type:"Clinique", adresse:"Allées du Dr Gillet, Dakar",              tel:"+221 33 889 00 00", lat:14.7140, lng:-17.4690 },
  { id:"l8",  nom:"Pharmacie Mermoz",                      type:"Pharmacie",adresse:"Rue 10 Mermoz, Dakar",                    tel:"+221 33 860 12 34", lat:14.7200, lng:-17.4680 },
  { id:"l9",  nom:"Hôpital Aristide Le Dantec",            type:"Hôpital",  adresse:"Rue Aimé Césaire, Dakar",                 tel:"+221 33 822 24 19", lat:14.7160, lng:-17.4640 },
  { id:"l10", nom:"Hôpital Général de Grand Yoff (HOGGY)", type:"Hôpital",  adresse:"Grand Yoff, Dakar",                       tel:"+221 33 867 18 18", lat:14.7340, lng:-17.4560 },
  { id:"l11", nom:"Hôpital Abass Ndao",                    type:"Hôpital",  adresse:"Colobane, Dakar",                         tel:"+221 33 823 64 64", lat:14.7220, lng:-17.4580 },
  { id:"l12", nom:"Hôpital Roi Baudouin (Guédiawaye)",     type:"Hôpital",  adresse:"Guédiawaye, Dakar",                       tel:"+221 33 876 44 44", lat:14.7760, lng:-17.3900 },
  { id:"l13", nom:"Hôpital de Ouakam",                     type:"Hôpital",  adresse:"Ouakam, Dakar",                           tel:"+221 33 820 11 11", lat:14.7290, lng:-17.4900 },
  { id:"l14", nom:"Cabinet Médical Dr Gorgui Diop",        type:"Cabinet",  adresse:"Keur Massar Cité Safco, Dakar",           tel:"+221 77 123 45 67", lat:14.7500, lng:-17.3000 },
  { id:"l15", nom:"Clinique 2A",                           type:"Clinique", adresse:"Tivaoune Peulh, Cité APIX, Keur Massar",  tel:"+221 33 820 22 22", lat:14.7320, lng:-17.2960 },
  { id:"l16", nom:"Cabinet Dentaire Al Makharil Asna",     type:"Cabinet",  adresse:"Cité APIX, Keur Massar, Dakar",           tel:"+221 33 867 44 55", lat:14.7480, lng:-17.3050 },
];

const DAKAR = [14.7167, -17.4677];

/* ── Helpers ────────────────────────────────────────────────────── */

function km(lat1, lng1, lat2, lng2) {
  const R = 6371, r = Math.PI / 180;
  const dL = (lat2 - lat1) * r, dG = (lng2 - lng1) * r;
  const a  = Math.sin(dL/2)**2 + Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin(dG/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const fmt = (d) => d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(2)} km`;


/* ── Leaflet ────────────────────────────────────────────────────── */
const makePin = (color, sel) => L.divIcon({
  className: "",
  html: sel
    ? `<svg width="28" height="38" viewBox="0 0 28 38"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 24 14 24S28 24.5 28 14 21.7 0 14 0z" fill="${color}"/><circle cx="14" cy="14" r="6" fill="white"/></svg>`
    : `<div style="width:13px;height:13px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
  iconSize: sel ? [28,38] : [13,13], iconAnchor: sel ? [14,38] : [6,6],
});

const userDot = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:24px;height:24px">
    <div style="position:absolute;inset:-8px;border-radius:50%;background:rgba(37,99,235,0.15)"></div>
    <div style="position:absolute;inset:0;border-radius:50%;background:#2563EB;border:3px solid white;box-shadow:0 2px 6px rgba(37,99,235,0.6)"></div>
  </div>`,
  iconSize: [24,24], iconAnchor: [12,12],
});

function FlyTo({ center, zoom }) {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (!center) return;
    const k = `${center[0]},${center[1]}`;
    if (k === prev.current) return;
    prev.current = k;
    map.setView(center, zoom ?? 15, { animate: true, duration: 0.7 });
  }, [center, zoom, map]);
  return null;
}

function Resizer({ trigger }) {
  const map = useMap();
  // Au montage (trigger=0) ET à chaque switch → recalcule la taille
  useEffect(() => { setTimeout(() => map.invalidateSize(), 50); }, [trigger, map]);
  return null;
}

function LocateBtn({ userLoc, onLocate }) {
  const map = useMap();
  return (
    <div className="leaflet-bottom leaflet-right" style={{ marginBottom:12, marginRight:12 }}>
      <div className="leaflet-control">
        <button
          onClick={() => userLoc ? map.setView(userLoc, 16, { animate:true }) : onLocate()}
          style={{ width:40,height:40,borderRadius:"50%",background:"white",border:"none",
            boxShadow:"0 2px 8px rgba(0,0,0,0.2)",cursor:"pointer",display:"flex",
            alignItems:"center",justifyContent:"center",color: userLoc ? BLUE : "#9CA3AF" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ── Illustration ───────────────────────────────────────────────── */
function Illu() {
  return (
    <div className="absolute inset-0" style={{ background:"linear-gradient(135deg,#1e3a5f 0%,#2563EB 60%,#3b82f6 100%)" }}>
      <svg viewBox="0 0 300 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <rect x="65"  y="40" width="170" height="140" rx="3" fill="rgba(0,0,0,0.25)"/>
        <rect x="70"  y="45" width="160" height="135" rx="2" fill="rgba(255,255,255,0.06)"/>
        {[82,107,132,157,182,207].map(x =>
          [57,77,97,117,137].map(y => (
            <rect key={`${x}-${y}`} x={x} y={y} width="16" height="12" rx="1.5" fill="rgba(186,230,255,0.45)"/>
          ))
        )}
        <circle cx="238" cy="75" r="21" fill="#EF4444"/>
        <text x="238" y="81" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="sans-serif">H</text>
        <ellipse cx="28"  cy="135" rx="22" ry="28" fill="rgba(0,30,60,0.4)"/>
        <ellipse cx="28"  cy="131" rx="19" ry="24" fill="rgba(255,255,255,0.1)"/>
        <rect    x="24"   y="157" width="6" height="22" fill="rgba(0,0,0,0.3)"/>
        <ellipse cx="272" cy="138" rx="18" ry="24" fill="rgba(0,30,60,0.4)"/>
        <ellipse cx="272" cy="134" rx="15" ry="20" fill="rgba(255,255,255,0.1)"/>
        <rect    x="268"  y="157" width="6" height="22" fill="rgba(0,0,0,0.3)"/>
        <rect x="0" y="170" width="300" height="10" fill="rgba(0,0,0,0.2)"/>
      </svg>
    </div>
  );
}

/* ── Card liste ─────────────────────────────────────────────────── */
function Card({ e, sel, onSel }) {
  return (
    <div onClick={() => onSel(e)}
      className={`bg-white rounded-2xl overflow-hidden cursor-pointer shadow-sm transition-all ${
        sel ? "ring-2 ring-blue-500 shadow-blue-100" : "border border-gray-100 hover:shadow-md"
      }`}
    >
      <div className="relative h-44">
        <Illu/>
        <div className="absolute top-3 right-3 z-10">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-sm ${e.prive ? "bg-amber-400" : "bg-blue-500"}`}>
            {e.prive ? "Privé" : "Public"}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent pt-10 pb-2.5 px-3">
          <div className="flex items-center gap-1.5 text-white text-[11px]">
            <MapPin size={10} className="flex-shrink-0"/>
            <span className="truncate">{e.adresse}</span>
          </div>
        </div>
      </div>
      <div className="px-3.5 py-3 flex items-center justify-between gap-3">
        <span className="text-[13px] font-bold text-gray-900 truncate leading-tight">{e.nom}</span>
        {e.dist !== null && (
          <div className="flex items-center gap-1 text-blue-600 text-[12px] font-semibold flex-shrink-0">
            <Navigation size={12}/>{fmt(e.dist)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Card carrousel ─────────────────────────────────────────────── */
function MiniCard({ e, sel, onSel }) {
  return (
    <div onClick={() => onSel(e)}
      className={`w-52 flex-shrink-0 bg-white rounded-2xl overflow-hidden cursor-pointer shadow-sm transition-all ${
        sel ? "ring-2 ring-blue-500" : "border border-gray-100"
      }`}
    >
      <div className="relative h-[104px]">
        <Illu/>
        <div className="absolute top-2 right-2 z-10">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold text-white ${e.prive ? "bg-amber-400" : "bg-blue-500"}`}>
            {e.prive ? "Privé" : "Public"}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/65 to-transparent pt-6 pb-1.5 px-2">
          <div className="flex items-center gap-1 text-white text-[9px]">
            <MapPin size={8} className="flex-shrink-0"/>
            <span className="truncate">{e.adresse}</span>
          </div>
        </div>
      </div>
      <div className="px-2.5 py-2 flex items-center justify-between gap-1">
        <span className="text-[11px] font-bold text-gray-900 truncate">{e.nom}</span>
        {e.dist !== null && (
          <div className="flex items-center gap-0.5 text-blue-600 text-[10px] font-semibold flex-shrink-0">
            <Navigation size={9}/>{fmt(e.dist)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Composant principal ────────────────────────────────────────── */
export default function Hopitaux() {
  const [data, setData]         = useState([...DATA]);
  const [loading, setLoading]   = useState(false);

  const [view, setView]         = useState("liste");
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);
  const [fly, setFly]           = useState(null);
  const [userLoc, setUserLoc]   = useState(null);
  const [acc, setAcc]           = useState(null);

  // Filtres
  const [typeStr, setTypeStr]   = useState("Tous");   // Publique | Privée | Tous
  const [maxDist, setMaxDist]   = useState(0);
  const [typePre, setTypePre]   = useState("Tous");   // Hôpital | Clinique | …
  const [region,  setRegion]    = useState("Toutes");

  // Modals
  const [filterOpen, setFilterOpen]   = useState(false);
  const [preOpen,    setPreOpen]      = useState(false);
  const [regOpen,    setRegOpen]      = useState(false);
  const preButtonRef = useRef(null);
  const regButtonRef = useRef(null);
  const [prePos, setPrePos] = useState({ top:0, left:0 });
  const [regPos, setRegPos] = useState({ top:0, left:0 });
  const [tTmp,  setTTmp]  = useState("Tous");
  const [dTmp,  setDTmp]  = useState(0);

  // Clé pour forcer le resize de la carte au switch (commence à 1 → Resizer se déclenche au montage)
  const [mapKey, setMapKey] = useState(1);

  const watchRef = useRef(null);
  const token    = sessionStorage.getItem("token");

  /* Précharge les tuiles Dakar — même URL que TileLayer (sous-domaine 'a' fixe) → cache garanti */
  useEffect(() => {
    const base = "https://a.basemaps.cartocdn.com/rastertiles/voyager/13";
    for (let x = 3696; x <= 3700; x++)
      for (let y = 3755; y <= 3759; y++)
        new Image().src = `${base}/${x}/${y}.png`;
  }, []);

  /* Géoloc */
  const startLocate = () => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setUserLoc(prev => { if (!prev) setFly({ center: loc, zoom: 15 }); return loc; });
        setAcc(pos.coords.accuracy);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  };
  useEffect(() => {
    startLocate();
    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current); };
  }, []);

  /* Chargement données */
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (token) {
          const r = await fetch("http://localhost:5000/api/hopitaux", { headers: { Authorization: `Bearer ${token}` } });
          if (r.ok) {
            const api = await r.json();
            const noms = api.map(h => h.nom);
            const db   = api.map(h => {
              const d = DATA.find(x => x.nom === h.nom) || {};
              return { id: h.id, nom: h.nom, type: h.type, adresse: h.adresse || d.adresse || h.ville,
                tel: h.telephone || d.tel || "—", lat: d.lat ?? DAKAR[0], lng: d.lng ?? DAKAR[1], source: "db" };
            });
            const merged = [...db, ...DATA.filter(d => !noms.includes(d.nom))];
            if (!cancelled) setData(merged);
          }
        }
      } catch {}
    };
    run();
    return () => { cancelled = true; };
  }, []);

  /* Filtrage */
  const enriched = data.map(e => ({
    ...e,
    prive: isPriveByType(e.type),
    dist:  userLoc ? km(userLoc[0], userLoc[1], e.lat, e.lng) : null,
  }));

  const filtered = enriched.filter(e => {
    if (search && !e.nom.toLowerCase().includes(search.toLowerCase()) && !e.adresse?.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeStr === "Publique" && e.prive)  return false;
    if (typeStr === "Privée"   && !e.prive) return false;
    if (typePre !== "Tous"     && e.type !== typePre) return false;
    if (region  !== "Toutes"   && !e.adresse?.toLowerCase().includes(region.toLowerCase())) return false;
    if (maxDist > 0 && e.dist !== null && e.dist > maxDist) return false;
    return true;
  }).sort((a, b) => (a.dist ?? 999) - (b.dist ?? 999));

  const handleSelect = (e) => { setSelected(e); setFly({ center: [e.lat, e.lng], zoom: 16 }); };

  const switchView = (v) => {
    setView(v);
    if (v === "carte") setMapKey(k => k + 1); // déclenche Resizer
  };

  const openFilter  = () => { setTTmp(typeStr); setDTmp(maxDist); setFilterOpen(true); };
  const applyFilter = () => { setTypeStr(tTmp); setMaxDist(dTmp); setFilterOpen(false); };
  const resetFilter = () => { setTypeStr("Tous"); setMaxDist(0); setTTmp("Tous"); setDTmp(0); setFilterOpen(false); };

  const openPre = () => {
    const r = preButtonRef.current?.getBoundingClientRect();
    if (r) setPrePos({ top: r.bottom + 6, left: r.left });
    setPreOpen(v => !v); setRegOpen(false);
  };
  const openReg = () => {
    const r = regButtonRef.current?.getBoundingClientRect();
    if (r) setRegPos({ top: r.bottom + 6, left: r.left });
    setRegOpen(v => !v); setPreOpen(false);
  };

  const hasFilter = typeStr !== "Tous" || maxDist > 0 || typePre !== "Tous" || region !== "Toutes";

  /* ── Rendu ──────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col -mx-4 -mt-4 bg-gray-50" style={{ minHeight:"100vh", position:"relative" }}>

      {/* ══ Header ══ */}
      <div className="sticky top-0 z-[50] bg-white border-b border-gray-100 shadow-sm">

        {/* Titre */}
        <div className="px-4 pt-4 pb-1">
          <h1 className="text-[17px] font-extrabold text-gray-900 tracking-tight">Prestataires</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {loading ? "Chargement…" : `${filtered.length} prestataire${filtered.length !== 1 ? "s" : ""} trouvé${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Recherche */}
        <div className="px-4 pt-2 pb-2">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Trouver un prestataire"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14}/>
              </button>
            )}
          </div>
        </div>

        {/* Toggle Liste / Carte */}
        <div className="px-4 pb-2">
          <div className="flex p-1 bg-gray-100 rounded-full">
            {[["liste","Liste"],["carte","Carte"]].map(([v, lbl]) => (
              <button key={v} onClick={() => switchView(v)}
                className="flex-1 py-2 rounded-full text-[13px] font-semibold transition-all"
                style={{ background: view === v ? BLUE : "transparent", color: view === v ? "white" : "#374151" }}
              >{lbl}</button>
            ))}
          </div>
        </div>

        {/* Filtres */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth:"none" }}>

          <button onClick={openFilter}
            className="flex-shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold border-2 transition-colors"
            style={{
              borderColor: (typeStr !== "Tous" || maxDist > 0) ? BLUE : "#D1D5DB",
              color:       (typeStr !== "Tous" || maxDist > 0) ? BLUE : "#6B7280",
              background:  (typeStr !== "Tous" || maxDist > 0) ? "#EFF6FF" : "white",
            }}
          >
            <SlidersHorizontal size={12}/> Filtrer par <ChevronDown size={12}/>
          </button>

          {/* Prestataire dropdown */}
          <div className="flex-shrink-0">
            <button ref={preButtonRef} onClick={openPre}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold border-2 transition-colors"
              style={{
                borderColor: typePre !== "Tous" ? BLUE : "#D1D5DB",
                color:       typePre !== "Tous" ? BLUE : "#6B7280",
                background:  typePre !== "Tous" ? "#EFF6FF" : "white",
              }}
            >
              {typePre === "Tous" ? "Prestataire" : typePre} <ChevronDown size={12}/>
            </button>
            {preOpen && createPortal(
              <>
                <div className="fixed inset-0 z-[999]" onClick={() => setPreOpen(false)}/>
                <div className="fixed bg-white rounded-2xl shadow-xl border border-gray-100 py-1 z-[1000] overflow-hidden"
                  style={{ top: prePos.top, left: prePos.left, minWidth: 155 }}>
                  {TYPES_PRESTATAIRE.map(t => (
                    <button key={t} onClick={() => { setTypePre(t); setPreOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-blue-50 transition-colors ${typePre === t ? "font-bold bg-blue-50" : "text-gray-700"}`}
                      style={{ color: typePre === t ? BLUE : undefined }}
                    >{t}</button>
                  ))}
                </div>
              </>,
              document.body
            )}
          </div>

          {/* Régions dropdown */}
          <div className="flex-shrink-0">
            <button ref={regButtonRef} onClick={openReg}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold border-2 transition-colors"
              style={{
                borderColor: region !== "Toutes" ? BLUE : "#D1D5DB",
                color:       region !== "Toutes" ? BLUE : "#6B7280",
                background:  region !== "Toutes" ? "#EFF6FF" : "white",
              }}
            >
              {region === "Toutes" ? "Régions" : region} <ChevronDown size={12}/>
            </button>
            {regOpen && createPortal(
              <>
                <div className="fixed inset-0 z-[999]" onClick={() => setRegOpen(false)}/>
                <div className="fixed bg-white rounded-2xl shadow-xl border border-gray-100 py-1 z-[1000] overflow-hidden"
                  style={{ top: regPos.top, left: regPos.left, minWidth: 145 }}>
                  {REGIONS.map(r => (
                    <button key={r} onClick={() => { setRegion(r); setRegOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-blue-50 transition-colors ${region === r ? "font-bold bg-blue-50" : "text-gray-700"}`}
                      style={{ color: region === r ? BLUE : undefined }}
                    >{r}</button>
                  ))}
                </div>
              </>,
              document.body
            )}
          </div>
        </div>

      </div>

      {/*
        ══ CARTE — opacity:0 + absolute en liste, visible en carte ══
        opacity:0 → le browser DOIT painter l'élément → les tiles chargent à priorité max
        overflow:hidden bloquait le chargement des images (browser optimisation)
        URL sans {s} → sous-domaine fixe → URLs préchargées = URLs de Leaflet → cache hit garanti
      */}
      <div style={view === "carte" ? {
        position: "relative",
        width: "100%",
        height: "calc(100vh - 360px)",
        minHeight: 260,
      } : {
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: "calc(100vh - 360px)",
        minHeight: 260,
        opacity: 0,
        pointerEvents: "none",
        zIndex: -1,
      }}>
        <MapContainer center={DAKAR} zoom={13} style={{ height:"100%", width:"100%" }}
          scrollWheelZoom={false} attributionControl={false}
        >
          {/* URL sans {s} → toujours le même sous-domaine → cache garanti */}
          <TileLayer
            url="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
            maxZoom={20}
          />
          <FlyTo center={fly?.center} zoom={fly?.zoom}/>
          <Resizer trigger={mapKey}/>
          {userLoc && (
            <>
              {acc && acc < 500 && (
                <Circle center={userLoc} radius={acc}
                  pathOptions={{ color:BLUE, fillColor:BLUE, fillOpacity:0.1, weight:1.5 }}/>
              )}
              <Marker position={userLoc} icon={userDot} zIndexOffset={2000}/>
            </>
          )}
          {/* Max 40 marqueurs pour éviter le lag de rendu DOM */}
          {filtered.slice(0, 40).map(e => (
            <Marker key={e.id} position={[e.lat, e.lng]}
              icon={makePin(TYPE_PIN[e.type] || "#6B7280", selected?.id === e.id)}
              zIndexOffset={selected?.id === e.id ? 1000 : 0}
              eventHandlers={{ click: () => handleSelect(e) }}
            />
          ))}
          <LocateBtn userLoc={userLoc} onLocate={startLocate}/>
        </MapContainer>
      </div>

      {/* Carrousel (carte uniquement) */}
      {view === "carte" && (
        <div className="bg-white border-t border-gray-100 shadow-inner">
          <div className="flex gap-3 overflow-x-auto px-4 py-3" style={{ scrollbarWidth:"none" }}>
            {loading ? (
              <div className="flex items-center gap-2 py-5 text-[13px] text-gray-400">
                <Loader2 size={13} className="animate-spin"/> Chargement…
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-5 text-[13px] text-gray-400">Aucun prestataire</div>
            ) : filtered.map(e => (
              <MiniCard key={e.id} e={e} sel={selected?.id === e.id} onSel={handleSelect}/>
            ))}
            <div className="w-2 flex-shrink-0"/>
          </div>
        </div>
      )}

      {/* ══ Liste ══ */}
      {view === "liste" && (
        <div className="flex-1 px-4 py-4 space-y-4">
          {hasFilter && (
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-blue-600 font-semibold">Filtres actifs</span>
              <button onClick={() => { setTypeStr("Tous"); setMaxDist(0); setTypePre("Tous"); setRegion("Toutes"); }}
                className="text-[11px] font-semibold text-rose-500 hover:text-rose-700">
                Réinitialiser
              </button>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                <Search size={24} className="text-blue-300"/>
              </div>
              <p className="text-[15px] font-semibold text-gray-700">Aucun prestataire trouvé</p>
              <p className="text-[13px] text-gray-400 mt-1">Modifiez vos filtres ou votre recherche</p>
            </div>
          )}

          {!loading && filtered.map((e, i) => (
            <motion.div key={e.id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: Math.min(i * 0.03, 0.25), duration:0.2 }}>
              <Card e={e} sel={selected?.id === e.id} onSel={handleSelect}/>
            </motion.div>
          ))}
          <div className="h-6"/>
        </div>
      )}

      {/* ══ Modal Filtrer par ══ */}
      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="fixed inset-0 bg-black/40 z-[50]" onClick={() => setFilterOpen(false)}/>
            <motion.div
              initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
              transition={{ type:"spring", stiffness:300, damping:30 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[60]"
            >
              <div className="flex justify-center pt-3">
                <div className="w-10 h-1 bg-gray-200 rounded-full"/>
              </div>
              <div className="px-6 pb-8">
                <div className="flex justify-between items-center py-4 mb-1">
                  <h3 className="text-[17px] font-bold text-gray-900">Filtrer par</h3>
                  <button onClick={() => setFilterOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
                    <X size={16}/>
                  </button>
                </div>

                {/* Type structure */}
                <div className="mb-7">
                  <p className="text-[13px] font-bold text-gray-700 mb-3">Type de structure</p>
                  <div className="flex gap-2">
                    {["Tous","Publique","Privée"].map(t => (
                      <button key={t} onClick={() => setTTmp(t)}
                        className="flex-1 py-2.5 rounded-full border-2 text-[13px] font-semibold transition-all"
                        style={{
                          borderColor: BLUE,
                          background: tTmp === t ? BLUE : "transparent",
                          color: tTmp === t ? "white" : BLUE,
                        }}
                      >{t}</button>
                    ))}
                  </div>
                </div>

                {/* Distance */}
                <div className="mb-8">
                  <p className="text-[13px] font-bold text-gray-700 mb-3">
                    Distance <span className="font-normal text-blue-600">({dTmp} km)</span>
                  </p>
                  <input type="range" min={0} max={100} value={dTmp}
                    onChange={e => setDTmp(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: BLUE }}
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                    {[0,20,40,60,80,100].map(v => <span key={v}>{v}</span>)}
                  </div>
                </div>

                <button onClick={applyFilter}
                  className="w-full py-4 rounded-2xl text-white font-bold text-[15px] mb-3 hover:opacity-90 transition-opacity"
                  style={{ background: BLUE }}
                >Appliquer</button>
                <button onClick={resetFilter}
                  className="w-full py-3 rounded-2xl text-[15px] font-semibold border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                >Annuler</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
