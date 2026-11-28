// Constantes du profil médecin : hôpitaux, spécialités, années d'exercice, valeurs par défaut.

export const HOPITAUX = [
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

export const SPECIALITES = [
  "Généraliste","Cardiologue","Dentiste","Gynécologue","Pédiatre",
  "Dermatologue","Ophtalmologue","ORL","Neurologue","Pneumologue",
  "Gastro-entérologue","Urologue","Psychiatre","Oncologue","Radiologue",
  "Urgentiste","Endocrinologue","Rhumatologue","Néphrologue","Chirurgien",
];

export const ANNEE_MIN = 1960;
export const ANNEE_MAX = new Date().getFullYear();

export const DEFAULT = { nom: "", email: "", telephone: "", specialite: "", numeroOrdre: "", anneeDebutPratique: "", hopital: "" };
export const INPUT_EDIT = "w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
