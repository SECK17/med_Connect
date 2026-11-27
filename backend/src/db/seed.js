// db/seed.js — données de départ, ajoutées seulement si la table est vide
const Hopital = require('../models/Hopital');

const HOPITAUX_SEED = [
  { nom: 'Hôpital Principal de Dakar',        type: 'Hôpital',  ville: 'Dakar'       },
  { nom: 'CHU de Fann',                        type: 'CHU',      ville: 'Dakar'       },
  { nom: 'Hôpital Aristide Le Dantec',         type: 'Hôpital',  ville: 'Dakar'       },
  { nom: 'Hôpital Général de Grand Yoff (HOGGY)', type: 'Hôpital', ville: 'Dakar'    },
  { nom: 'Hôpital de Pikine',                  type: 'Hôpital',  ville: 'Pikine'      },
  { nom: 'Hôpital Abass Ndao',                 type: 'Hôpital',  ville: 'Dakar'       },
  { nom: 'Hôpital Roi Baudouin (Guédiawaye)',  type: 'Hôpital',  ville: 'Guédiawaye'  },
  { nom: 'Hôpital de Ouakam',                  type: 'Hôpital',  ville: 'Dakar'       },
  { nom: 'Polyclinique SUMA',                  type: 'Centre',   ville: 'Dakar'       },
  { nom: 'Clinique Pasteur',                   type: 'Clinique', ville: 'Dakar'       },
];

const seedHopitaux = async () => {
  const count = await Hopital.count();
  if (count === 0) {
    await Hopital.bulkCreate(HOPITAUX_SEED);
    console.log('✅ Hôpitaux seedés (10 établissements)');
  }
};

module.exports = { seedHopitaux, HOPITAUX_SEED };
