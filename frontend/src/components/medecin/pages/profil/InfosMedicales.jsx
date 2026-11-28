// Section « Informations médicales » : spécialité, numéro d'ordre, expérience, tarif.
import { Stethoscope, Hash, Lock } from "lucide-react";
import { SPECIALITES, ANNEE_MIN, ANNEE_MAX, INPUT_EDIT } from "./constantes.js";

export default function InfosMedicales({ profile, edit, p, set }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-900 mb-4">
        <Stethoscope size={14} className="text-blue-600" /> Informations médicales
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Spécialité — verrouillée une fois définie */}
        <div className="sm:col-span-2">
          <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1">
            Spécialité {profile.specialite && <Lock size={9} className="text-gray-300" />}
          </label>
          {edit ? (
            profile.specialite ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                <Stethoscope size={12} className="text-gray-400 flex-shrink-0" />
                <span className="flex-1 text-[13px] text-gray-700">{profile.specialite}</span>
                <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded font-medium">Non modifiable</span>
              </div>
            ) : (
              <select value={p.specialite} onChange={e => set("specialite", e.target.value)} className={INPUT_EDIT}>
                <option value="">Choisir une spécialité</option>
                {SPECIALITES.map(s => <option key={s}>{s}</option>)}
              </select>
            )
          ) : (
            <div className="flex items-center gap-2 text-[13px] text-gray-900 py-2 border-b border-gray-100">
              <Stethoscope size={12} className="text-gray-400" /> {p.specialite || "—"}
            </div>
          )}
        </div>

        {/* Numéro d'ordre — verrouillé une fois défini */}
        <div>
          <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1">
            Numéro d'ordre {profile.numeroOrdre && <Lock size={9} className="text-gray-300" />}
          </label>
          {edit ? (
            profile.numeroOrdre ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                <Hash size={12} className="text-gray-400 flex-shrink-0" />
                <span className="flex-1 text-[13px] text-gray-700">{profile.numeroOrdre}</span>
                <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded font-medium">Non modifiable</span>
              </div>
            ) : (
              <input value={p.numeroOrdre} onChange={e => set("numeroOrdre", e.target.value)} placeholder="SN-XXXXX" className={INPUT_EDIT} />
            )
          ) : (
            <div className="flex items-center gap-2 text-[13px] text-gray-900 py-2 border-b border-gray-100">
              <Hash size={12} className="text-gray-400" /> {p.numeroOrdre || "—"}
            </div>
          )}
        </div>

        {/* Année de début de pratique — verrouillée une fois définie */}
        <div>
          <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1">
            Année de début de pratique {profile.anneeDebutPratique && <Lock size={9} className="text-gray-300" />}
          </label>
          {edit ? (
            profile.anneeDebutPratique ? (
              <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                <div className="flex-1">
                  <div className="text-[13px] text-gray-700 font-semibold">Depuis {ANNEE_MAX - parseInt(profile.anneeDebutPratique)} · {profile.anneeDebutPratique} ans de pratique</div>
                </div>
                <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded font-medium flex-shrink-0">Non modifiable</span>
              </div>
            ) : (
              <div className="space-y-1">
                <input
                  type="number"
                  min={ANNEE_MIN}
                  max={ANNEE_MAX}
                  value={p.anneeDebutPratique}
                  onChange={e => set("anneeDebutPratique", e.target.value)}
                  placeholder={`Ex: ${ANNEE_MAX - 10}`}
                  className={INPUT_EDIT}
                />
                <p className="text-[10px] text-amber-600">⚠ Une fois définie, cette année ne pourra plus être modifiée</p>
              </div>
            )
          ) : (
            <div className="text-[13px] text-gray-900 py-2 border-b border-gray-100">
              {p.anneeDebutPratique
                ? `Depuis ${ANNEE_MAX - parseInt(p.anneeDebutPratique)} · ${p.anneeDebutPratique} ans de pratique`
                : "—"}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
