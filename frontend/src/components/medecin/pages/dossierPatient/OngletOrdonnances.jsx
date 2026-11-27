// Onglet « Ordonnances » du dossier patient : liste, détail, envoi d'une ordonnance.
import { motion, AnimatePresence } from "motion/react";
import { FileText, Download, Printer, Eye, Image, Pill, ChevronDown, ChevronUp, Upload, Camera, X } from "lucide-react";
import { fileUrl, isPdf, formatDate, handleDownload, handlePrint } from "../../../../utils/fichiers.js";

export default function OngletOrdonnances({ showUploadOrd, setShowUploadOrd, setOrdFile, setOrdPreview, ordPreview, ordFile, onOrdFile, setShowOrdCam, ordNotes, setOrdNotes, submitOrd, savingOrd, loadingOrd, ordonnances, setOpenId, openId, setPreview }) {
  return (
    <motion.div key="ord" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">

      {/* Form upload inline */}
      <AnimatePresence>
        {showUploadOrd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-xl overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-semibold text-blue-800">Nouvelle ordonnance</div>
                <button onClick={() => { setShowUploadOrd(false); setOrdFile(null); setOrdPreview(null); }}
                  className="text-blue-400 hover:text-blue-600"><X size={14} /></button>
              </div>
              <label htmlFor="ord-file-input"
                className="block border-2 border-dashed border-blue-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-100 transition-colors"
              >
                {ordPreview ? (
                  <img src={ordPreview} alt="" className="max-h-36 mx-auto rounded-lg object-contain" />
                ) : ordFile ? (
                  <div className="flex items-center gap-2 justify-center text-[12px] text-blue-700">
                    <FileText size={16} /> {ordFile.name}
                  </div>
                ) : (
                  <div className="text-[12px] text-blue-500">
                    <Upload size={18} className="mx-auto mb-1 text-blue-400" />
                    Choisir un fichier
                  </div>
                )}
              </label>
              <input id="ord-file-input" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={onOrdFile} />
              {!ordFile && (
                <>
                  <p className="text-center text-[10px] text-gray-400">— ou —</p>
                  <button type="button"
                    onClick={() => setShowOrdCam(true)}
                    className="flex items-center justify-center gap-1.5 py-2 w-full border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[12px] font-semibold rounded-lg transition-colors"
                  >
                    <Camera size={13} /> Prendre une photo
                  </button>
                </>
              )}
              <textarea value={ordNotes} onChange={e => setOrdNotes(e.target.value)}
                placeholder="Notes (optionnel)…" rows={2}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-[12px] bg-white focus:outline-none focus:border-blue-400 resize-none"
              />
              <button onClick={submitOrd} disabled={savingOrd}
                className="w-full h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[12px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {savingOrd ? "Envoi…" : <><Upload size={13} /> Envoyer</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loadingOrd && <div className="text-center py-8 text-[13px] text-slate-400">Chargement…</div>}
      {!loadingOrd && ordonnances.length === 0 && !showUploadOrd && (
        <div className="text-center py-10">
          <FileText size={28} className="mx-auto text-slate-200 mb-2" />
          <p className="text-[13px] text-slate-400">Aucune ordonnance</p>
        </div>
      )}
      {!loadingOrd && ordonnances.map(o => (
        <div key={o.id} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors text-left"
            onClick={() => setOpenId(openId === o.id ? null : o.id)}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              {o.fichier ? <Image size={14} className="text-blue-600" /> : <Pill size={14} className="text-blue-600" />}
            </div>
            <div className="flex-1">
              <div className="text-[12px] font-semibold text-slate-800">{formatDate(o.date)}</div>
              <div className="text-[11px] text-slate-500">
                {o.fichier ? "Photo d'ordonnance" : `${o.drugs.length} médicament(s)`}
              </div>
            </div>
            {o.fichier && (
              <button onClick={e => { e.stopPropagation(); handleDownload(o.fichier, `ord-${o.id}`); }}
                className="w-6 h-6 rounded-md bg-sky-100 flex items-center justify-center text-sky-600 hover:bg-sky-200"
              >
                <Download size={11} />
              </button>
            )}
            {openId === o.id ? <ChevronUp size={13} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={13} className="text-slate-400 flex-shrink-0" />}
          </button>

          <AnimatePresence>
            {openId === o.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-2 border-t border-gray-200 space-y-3">
                  {o.fichier && (
                    <>
                      {isPdf(o.fichier) ? (
                        <button onClick={() => window.open(fileUrl(o.fichier), "_blank")}
                          className="flex items-center gap-2 w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[12px] text-slate-700 hover:bg-gray-50"
                        >
                          <FileText size={14} className="text-red-500" /> Ouvrir le PDF
                        </button>
                      ) : (
                        <div onClick={() => setPreview(fileUrl(o.fichier))}
                          className="relative rounded-xl overflow-hidden border border-gray-200 cursor-zoom-in group"
                        >
                          <img src={fileUrl(o.fichier)} alt="" className="w-full max-h-56 object-contain bg-white" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Eye size={22} className="text-white drop-shadow" />
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => handleDownload(o.fichier, `ord-${o.id}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-medium rounded-lg transition-colors"
                        >
                          <Download size={11} /> Télécharger
                        </button>
                        {!isPdf(o.fichier) && (
                          <button onClick={() => handlePrint(o.fichier)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 text-[11px] font-medium rounded-lg transition-colors"
                          >
                            <Printer size={11} /> Imprimer
                          </button>
                        )}
                      </div>
                    </>
                  )}
                  {!o.fichier && o.drugs.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white rounded-lg px-3 py-2">
                      <Pill size={12} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[12px] font-medium text-slate-800">{d.name}</div>
                        <div className="text-[11px] text-slate-500">{d.dosage}{d.duration ? ` · ${d.duration}` : ""}</div>
                      </div>
                    </div>
                  ))}
                  {o.notes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-[11px] text-amber-800">
                      Note : {o.notes}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </motion.div>
  );
}
