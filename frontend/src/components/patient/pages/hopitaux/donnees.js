// Prestataires de santé : types, régions, couleurs des marqueurs, liste de référence, calcul de distance.

/* ── Palette ────────────────────────────────────────────────────── */
export const BLUE = "#2563EB";

/* ── Config types ───────────────────────────────────────────────── */
export const TYPES_PRESTATAIRE = ["Tous", "Hôpital", "CHU", "Clinique", "Cabinet", "Pharmacie", "Centre"];
export const REGIONS           = ["Toutes", "Dakar", "Pikine", "Guédiawaye", "Rufisque", "Keur Massar", "Thiès"];
export const isPriveByType     = (t) => ["Clinique", "Cabinet", "Pharmacie"].includes(t);

export const TYPE_PIN = {
  "Hôpital":   "#EF4444",
  "CHU":       "#EF4444",
  "Clinique":  "#3B82F6",
  "Pharmacie": "#10B981",
  "Centre":    "#8B5CF6",
  "Cabinet":   "#F59E0B",
};

/* ── Données statiques ──────────────────────────────────────────── */
export const DATA = [
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

export const DAKAR = [14.7167, -17.4677];

/* ── Helpers ────────────────────────────────────────────────────── */

export function km(lat1, lng1, lat2, lng2) {
  const R = 6371, r = Math.PI / 180;
  const dL = (lat2 - lat1) * r, dG = (lng2 - lng1) * r;
  const a  = Math.sin(dL/2)**2 + Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin(dG/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export const fmt = (d) => d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(2)} km`;
