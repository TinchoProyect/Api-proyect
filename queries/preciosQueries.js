// queries/preciosQueries.js
const sql = require('mssql');

/**
 * getPrecios(filters)
 * filters: { search?, moneda?, limit?, offset? }
 *  - search: texto libre (busca en nombre y en numero)
 *  - moneda: (opcional) nombre de la moneda (coincidencia exacta con m.nombre)
 *  - limit : default 100 (max 1000)
 *  - offset: default 0
 *
 * Devuelve: { total, data: [ { articulo, descripcion, costo, moneda, iva, precio_neg, mayorista, especial_brus, consumidor_final, lista_5 } ] }
 * Implementación compatible con SQL Server 2008 R2 (ROW_NUMBER()).
 */
const getPrecios = async (filters = {}) => {
  try {
    const {
      search = null,
      moneda = null,
      limit: rawLimit = 100,
      offset: rawOffset = 0,
    } = filters;

    const limit  = Math.min(Math.max(parseInt(rawLimit, 10)  || 100, 1), 1000);
    const offset = Math.max(parseInt(rawOffset, 10) || 0, 0);

    // WHERE dinámico (2008 R2)
    const where = [
      'ar.eliminado = 0',
      "( @search IS NULL OR ar.nombre LIKE ('%' + @search + '%') OR CAST(ar.numero AS NVARCHAR(50)) LIKE ('%' + @search + '%') )",
      '( @moneda IS NULL OR m.nombre = @moneda )',
    ].join(' AND ');

    // CTE + ROW_NUMBER para paginar y COUNT(*) OVER para total
    // Nota: aquí uso alias "normales" (sin espacios) para que el JSON sea estable.
    const query = `
      WITH base AS (
        SELECT
          ar.numero                           AS articulo,
          ar.nombre                           AS descripcion,
          ar.costo                            AS costo,
          m.nombre                            AS moneda,
          CAST(ar.iva AS decimal(9,2))        AS iva,
          ar.precio1                          AS precio_neg,
          ar.precio2                          AS mayorista,
          ar.precio3                          AS especial_brus,
          ar.precio4                          AS consumidor_final,
          ar.precio5                          AS lista_5
        FROM dbo.articulos ar
        JOIN dbo.monedas   m  ON m.codigo = ar.moneda
        WHERE ${where}
      ),
      numerada AS (
        SELECT
          b.*,
          ROW_NUMBER() OVER (ORDER BY b.descripcion) AS rn,
          COUNT(*)  OVER ()                           AS total_rows
        FROM base b
      )
      SELECT *
      FROM numerada
      WHERE rn BETWEEN (@offset + 1) AND (@offset + @limit)
      ORDER BY rn;
    `;

    const request = new sql.Request();
    request.input('search', sql.NVarChar(200), search);
    request.input('moneda', sql.NVarChar(50),  moneda);
    request.input('limit',  sql.Int,           limit);
    request.input('offset', sql.Int,           offset);
    request.timeout = 30000;

    const result = await request.query(query);
    const rows   = result.recordset || [];
    const total  = rows.length ? rows[0].total_rows : 0;

    // Ya vienen con alias normalizados desde el SQL.
    return { total, data: rows };
  } catch (error) {
    throw new Error('Error al obtener precios: ' + error.message);
  }
};

/**
 * getPreciosLegacy()
 * Devuelve el shape EXACTO de tu SELECT original (con alias con espacios).
 * Útil si necesitás un contrato “legado” tal como tu consulta.
 */
const SELECT_PRECIOS_LEGACY = `
SELECT 
    ar.numero   AS [Artículo],
    ar.nombre   AS [Descripción],
    ar.costo    AS [Costo],
    m.nombre    AS [Moneda],
    CAST(ar.iva AS decimal(9,2)) AS [IVA],
    ar.precio1  AS [Precio Neg.],
    ar.precio2  AS [Mayorista],
    ar.precio3  AS [Especial (Brus)],
    ar.precio4  AS [Consumidor Final],
    ar.precio5  AS [Lista 5]
FROM dbo.articulos  ar
JOIN dbo.monedas    m  ON m.codigo = ar.moneda
WHERE ar.eliminado = 0
ORDER BY ar.nombre ASC;
`;

const getPreciosLegacy = async () => {
  try {
    const request = new sql.Request();
    request.timeout = 30000;
    const result = await request.query(SELECT_PRECIOS_LEGACY);
    return result.recordset || [];
  } catch (error) {
    throw new Error('Error al obtener precios (legacy): ' + error.message);
  }
};

module.exports = { getPrecios, getPreciosLegacy };
