// Fenêtre « Filtrer par » : type de prestataire, région, secteur public ou privé.
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { BLUE } from "./donnees.js";

export default function ModaleFiltres({ filterOpen, setFilterOpen, setTTmp, tTmp, dTmp, setDTmp, applyFilter, resetFilter }) {
  return (
    <AnimatePresence>
      {filterOpen && (
        <>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 z-[50]" onClick={() => setFilterOpen(false)}/>
          <motion.div
            initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
            transition={{ type:"spring", stiffness:300, damping:30 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[60]"
          >
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 bg-gray-200 rounded-full"/>
            </div>
            <div className="px-6 pb-8">
              <div className="flex justify-between items-center py-4 mb-1">
                <h3 className="text-[17px] font-bold text-gray-900">Filtrer par</h3>
                <button onClick={() => setFilterOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
                  <X size={16}/>
                </button>
              </div>

              {/* Type structure */}
              <div className="mb-7">
                <p className="text-[13px] font-bold text-gray-700 mb-3">Type de structure</p>
                <div className="flex gap-2">
                  {["Tous","Publique","Privée"].map(t => (
                    <button key={t} onClick={() => setTTmp(t)}
                      className="flex-1 py-2.5 rounded-full border-2 text-[13px] font-semibold transition-all"
                      style={{
                        borderColor: BLUE,
                        background: tTmp === t ? BLUE : "transparent",
                        color: tTmp === t ? "white" : BLUE,
                      }}
                    >{t}</button>
                  ))}
                </div>
              </div>

              {/* Distance */}
              <div className="mb-8">
                <p className="text-[13px] font-bold text-gray-700 mb-3">
                  Distance <span className="font-normal text-blue-600">({dTmp} km)</span>
                </p>
                <input type="range" min={0} max={100} value={dTmp}
                  onChange={e => setDTmp(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: BLUE }}
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                  {[0,20,40,60,80,100].map(v => <span key={v}>{v}</span>)}
                </div>
              </div>

              <button onClick={applyFilter}
                className="w-full py-4 rounded-2xl text-white font-bold text-[15px] mb-3 hover:opacity-90 transition-opacity"
                style={{ background: BLUE }}
              >Appliquer</button>
              <button onClick={resetFilter}
                className="w-full py-3 rounded-2xl text-[15px] font-semibold border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
              >Annuler</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
