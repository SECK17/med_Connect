// Section « Informations générales » du profil médecin (consultation et modification).
import { User, Phone, Mail, Lock } from "lucide-react";
import { INPUT_EDIT } from "./constantes.js";

export default function InfosGenerales({ edit, p, set }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-900 mb-4">
        <User size={14} className="text-blue-600" /> Informations générales
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Nom — modifiable */}
        <div>
          <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Nom complet</label>
          {edit ? (
            <input type="text" value={p.nom} onChange={e => set("nom", e.target.value)} className={INPUT_EDIT} />
          ) : (
            <div className="text-[13px] text-gray-900 py-2 border-b border-gray-100">{p.nom || "—"}</div>
          )}
        </div>

        {/* Téléphone — modifiable */}
        <div>
          <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Téléphone</label>
          {edit ? (
            <input type="tel" value={p.telephone} onChange={e => set("telephone", e.target.value)} className={INPUT_EDIT} />
          ) : (
            <div className="flex items-center gap-2 text-[13px] text-gray-900 py-2 border-b border-gray-100">
              <Phone size={12} className="text-gray-400" /> {p.telephone || "—"}
            </div>
          )}
        </div>

        {/* Email — toujours verrouillé */}
        <div className="sm:col-span-2">
          <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1">
            Email <Lock size={9} className="text-gray-300" />
          </label>
          {edit ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
              <Mail size={12} className="text-gray-400 flex-shrink-0" />
              <span className="flex-1 text-[13px] text-gray-600">{p.email || "—"}</span>
              <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded font-medium">Non modifiable</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[13px] text-gray-900 py-2 border-b border-gray-100">
              <Mail size={12} className="text-gray-400" /> {p.email || "—"}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
