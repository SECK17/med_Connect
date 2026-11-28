// Composants liés à la carte : recentrage animé, redimensionnement, bouton « Ma position ».
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { BLUE } from "./donnees.js";

export function FlyTo({ center, zoom }) {
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

export function Resizer({ trigger }) {
  const map = useMap();
  // Au montage (trigger=0) ET à chaque switch → recalcule la taille
  useEffect(() => { setTimeout(() => map.invalidateSize(), 50); }, [trigger, map]);
  return null;
}

export function LocateBtn({ userLoc, onLocate }) {
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
