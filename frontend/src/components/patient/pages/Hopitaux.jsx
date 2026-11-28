import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import { motion } from "motion/react";
import { Search, X, Loader2, ChevronDown, SlidersHorizontal } from "lucide-react";
import { API_URL } from "../../../config.js";
import { signalerErreur } from "../../../utils/erreurs.js";
import { Card, MiniCard } from "./hopitaux/Fiches.jsx";
import { FlyTo, Resizer, LocateBtn } from "./hopitaux/Carte.jsx";
import { makePin, userDot } from "./hopitaux/marqueurs.js";
import { BLUE, TYPES_PRESTATAIRE, REGIONS, isPriveByType, TYPE_PIN, DATA, DAKAR, km } from "./hopitaux/donnees.js";
import ModaleFiltres from "./hopitaux/ModaleFiltres";

/* ── Composant principal ────────────────────────────────────────── */
export default function Hopitaux() {
  const [data, setData]         = useState([...DATA]);
  const [loading] = useState(false); // jamais modifié : la liste est chargée sans indicateur

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
          const r = await fetch(`${API_URL}/api/hopitaux`, { headers: { Authorization: `Bearer ${token}` } });
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
      } catch (err) { signalerErreur(err); }
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
      <ModaleFiltres filterOpen={filterOpen} setFilterOpen={setFilterOpen} setTTmp={setTTmp} tTmp={tTmp} dTmp={dTmp} setDTmp={setDTmp} applyFilter={applyFilter} resetFilter={resetFilter} />
    </div>
  );
}
