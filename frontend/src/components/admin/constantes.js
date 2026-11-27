// Constantes de l'espace administrateur (menu, rôles, état des services, dates).
import { Users, Heart, LayoutDashboard, UserCheck, Server, Database, Wifi, Building2, ArrowRightLeft, ShieldCheck } from "lucide-react";

export const NAV = [
  { key: "overview",    label: "Vue d'ensemble",   icon: LayoutDashboard },
  { key: "users",       label: "Utilisateurs",     icon: Users },
  { key: "validations", label: "Validations",      icon: UserCheck, badge: true },
  { key: "hopitaux",    label: "Hôpitaux",         icon: Building2 },
  { key: "demandes",    label: "Demandes hôpital", icon: ArrowRightLeft, badge: "demandes" },
  { key: "don_sang",    label: "Don de sang",      icon: Heart },
  { key: "journal",     label: "Journal d'accès",  icon: ShieldCheck },
];

export const ROLE_CFG = {
  admin:         { label: "Admin",       bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500",  avatar: "bg-violet-100 text-violet-700"  },
  medecin:       { label: "Médecin",     bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", avatar: "bg-emerald-100 text-emerald-700" },
  patient:       { label: "Patient",     bg: "bg-sky-100",     text: "text-sky-700",     dot: "bg-sky-500",     avatar: "bg-sky-100 text-sky-700"         },
  donneur:       { label: "Donneur",     bg: "bg-rose-100",    text: "text-rose-700",    dot: "bg-rose-500",    avatar: "bg-rose-100 text-rose-700"       },
  admin_hopital: { label: "Admin hôp.", bg: "bg-orange-100",  text: "text-orange-700", dot: "bg-orange-500", avatar: "bg-orange-100 text-orange-700"  },
};

export const HEALTH = [
  { label: "Serveur API",        icon: Server,   status: "ok" },
  { label: "Base de données",    icon: Database, status: "ok" },
  { label: "Réseau & API",       icon: Wifi,     status: "ok" },
];

export const DAYS_FR  = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
export const MONTHS_FR = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
