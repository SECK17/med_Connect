// utils/pagination.js
// Pagination OPTIONNELLE pour les routes de listes.
//
//   GET /api/xxx                 → comportement inchangé (liste complète)
//   GET /api/xxx?page=2&limit=20 → 20 éléments, page 2
//
// Le corps de la réponse reste un tableau (compatibilité avec le frontend existant) ;
// les infos de pagination sont envoyées dans les en-têtes :
//   X-Total-Count, X-Page, X-Limit, X-Total-Pages

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

/**
 * Lit ?page et ?limit. Renvoie null si aucun n'est fourni (pas de pagination),
 * sinon { page, limit, offset } avec des valeurs bornées.
 */
const getPagination = (req) => {
  const { page, limit } = req.query;
  if (page === undefined && limit === undefined) return null;

  const l = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const p = Math.max(parseInt(page, 10) || 1, 1);
  return { page: p, limit: l, offset: (p - 1) * l };
};

/**
 * Exécute findAll ou findAndCountAll selon la présence de pagination,
 * ajoute les en-têtes, et renvoie toujours un tableau de lignes.
 *
 *   const rows = await paginatedFindAll(req, res, Model, { where, include, order });
 */
const paginatedFindAll = async (req, res, Model, options = {}) => {
  const pg = getPagination(req);
  if (!pg) return Model.findAll(options);

  const { count, rows } = await Model.findAndCountAll({
    ...options,
    // Un ordre stable est indispensable pour que les pages ne se chevauchent pas
    order: options.order ? [...options.order, [Model.primaryKeyAttribute, 'ASC']] : [[Model.primaryKeyAttribute, 'ASC']],
    limit: pg.limit,
    offset: pg.offset,
    distinct: true, // compte correct même avec des include
  });
  setPaginationHeaders(res, pg, count);
  return rows;
};

const setPaginationHeaders = (res, pg, total) => {
  res.set({
    'X-Total-Count': String(total),
    'X-Page': String(pg.page),
    'X-Limit': String(pg.limit),
    'X-Total-Pages': String(Math.max(Math.ceil(total / pg.limit), 1)),
  });
};

module.exports = { getPagination, paginatedFindAll, setPaginationHeaders, MAX_LIMIT };
