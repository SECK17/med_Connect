// Icônes Leaflet : marqueur d'un prestataire (sélectionné ou non) et position de l'utilisateur.
import L from "leaflet";

/* ── Leaflet ────────────────────────────────────────────────────── */
export const makePin = (color, sel) => L.divIcon({
  className: "",
  html: sel
    ? `<svg width="28" height="38" viewBox="0 0 28 38"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 24 14 24S28 24.5 28 14 21.7 0 14 0z" fill="${color}"/><circle cx="14" cy="14" r="6" fill="white"/></svg>`
    : `<div style="width:13px;height:13px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
  iconSize: sel ? [28,38] : [13,13], iconAnchor: sel ? [14,38] : [6,6],
});

export const userDot = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:24px;height:24px">
    <div style="position:absolute;inset:-8px;border-radius:50%;background:rgba(37,99,235,0.15)"></div>
    <div style="position:absolute;inset:0;border-radius:50%;background:#2563EB;border:3px solid white;box-shadow:0 2px 6px rgba(37,99,235,0.6)"></div>
  </div>`,
  iconSize: [24,24], iconAnchor: [12,12],
});
