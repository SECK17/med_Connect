// Illustration d'accueil et fiches d'un prestataire (liste et carrousel de la carte).
import { Navigation, MapPin } from "lucide-react";
import { fmt } from "./donnees.js";

/* ── Illustration ───────────────────────────────────────────────── */
export function Illu() {
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
export function Card({ e, sel, onSel }) {
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
export function MiniCard({ e, sel, onSel }) {
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
