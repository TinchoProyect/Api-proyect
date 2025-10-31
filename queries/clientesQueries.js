// queries/clientesQueries.js
const sql = require('mssql');

/**
 * getClientes(filters)
 * filters: { search?, zona?, vendedor?, limit?, offset? }
 * - search: texto libre (busca en nombre, apellido, cuit)
 * - zona: (opcional) id/empresa de zona (segun diagnostico actual)
 * - vendedor: (opcional) id de empleado
 * - limit: default 100 (max 1000)
 * - offset: default 0
 */
const getClientes = async (filters = {}) => {
  try {
    const {
      search = null,
      zona = null,
      vendedor = null,
      limit: rawLimit = 100,
      offset: rawOffset = 0
    } = filters;

    const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 100, 1), 1000);
    const offset = Math.max(parseInt(rawOffset, 10) || 0, 0);

    // Armamos WHERE dinámico compatible con SQL Server 2008 R2
    const where = [
      'c.eliminado = 0',
      '( @search IS NULL OR c.nombre LIKE (\'%\' + @search + \'%\') OR c.apellido LIKE (\'%\' + @search + \'%\') OR c.cuit LIKE (\'%\' + @search + \'%\') )',
      '( @zona IS NULL OR c.empresa = @zona )',
      '( @vendedor IS NULL OR c.empleado = @vendedor )'
    ].join(' AND ');

    // Paginación con ROW_NUMBER() (compatible 2008 R2)
    const query = `
      WITH base AS (
        SELECT 
          c.codigo AS cliente_id,
          c.nombre AS nombre,
          c.lista_precio AS lista_precios,
          tipos_iva.nombre   AS condicion_iva,
          zonas.nombre       AS zona,
          c.apellido         AS apellido,
          c.otros            AS otros,
          c.cuit             AS cuit,
          empleados.apellido AS vendedor,
          c.telefono2        AS telefono_2,
          c.telefono         AS telefono,
          c.email            AS email,
          c.celular          AS celular,
          c.cuenta_limite    AS limite_cta,
          CONVERT(date, c.fecha_nacimiento) AS nacimiento,
          localidades.nombre AS localidad,
          provincias.nombre  AS provincia,
          paises.nombre      AS pais,
          CAST(c.dni AS varchar(20)) AS dni,
          c.domicilio        AS domicilio
        FROM dbo.clientes c
        LEFT JOIN dbo.tipos_iva    ON c.condicion_iva = tipos_iva.codigo
        LEFT JOIN dbo.zonas        ON c.empresa = zonas.empresa
        LEFT JOIN dbo.empleados    ON c.empleado = empleados.codigo
        LEFT JOIN dbo.localidades  ON c.localidad = localidades.codigo
        LEFT JOIN dbo.provincias   ON c.provincia = provincias.codigo
        LEFT JOIN dbo.paises       ON c.pais = paises.codigo
        WHERE ${where}
      ),
      numerada AS (
        SELECT 
          b.*,
          ROW_NUMBER() OVER (ORDER BY b.nombre) AS rn,
          COUNT(*) OVER() AS total_rows
        FROM base b
      )
      SELECT *
      FROM numerada
      WHERE rn BETWEEN (@offset + 1) AND (@offset + @limit)
      ORDER BY rn;
    `;

    const request = new sql.Request();
    request.input('search', sql.NVarChar(200), search);
    request.input('zona', sql.Int, zona === null ? null : parseInt(zona, 10));
    request.input('vendedor', sql.Int, vendedor === null ? null : parseInt(vendedor, 10));
    request.input('limit', sql.Int, limit);
    request.input('offset', sql.Int, offset);

    const result = await request.query(query);
    const rows = result.recordset || [];
    const total = rows.length ? rows[0].total_rows : 0;

    return { total, data: rows };
  } catch (error) {
    throw new Error('Error al obtener los clientes: ' + error.message);
  }
};

/**
 * getClientesLegacy()
 * Consulta liviana para /consulta con contrato legacy exacto (21 campos)
 * Sin paginación, sin filtros, SQL Server 2008 compatible
 */
const getClientesLegacy = async () => {
  try {
    const query = `
      SELECT
        CAST(c.codigo AS INT)                         AS [Número],
        ISNULL(LTRIM(RTRIM(c.nombre)),   '')          AS [Nombre],
        ISNULL(LTRIM(RTRIM(c.apellido)), '')          AS [Apellido],
        c.lista_precio                                 AS [ListaPrecios],
        NULL                                          AS [CondIVA],
        NULL                                          AS [Zona],
        c.cuit                                        AS [CUIT],
        NULL                                          AS [Vendedor],
        c.telefono2                                   AS [Telefono2],
        c.telefono                                    AS [Telefono],
        c.email                                       AS [Email],
        c.celular                                     AS [Celular],
        c.cuenta_limite                               AS [CuentaLimite],
        CONVERT(VARCHAR(10), c.fecha_nacimiento, 120) AS [Nacimiento],
        NULL                                          AS [Localidad],
        NULL                                          AS [Provincia],
        NULL                                          AS [Pais],
        CAST(c.dni AS VARCHAR(20))                    AS [DNI],
        c.domicilio                                   AS [Domicilio],
        c.otros                                       AS [Otros],
        NULL                                          AS [saldo]
      FROM dbo.clientes c
      WHERE c.eliminado = 0
      ORDER BY c.codigo;
    `;

    const request = new sql.Request();
    request.timeout = 30000; // Evitar timeouts
    
    const result = await request.query(query);
    return result.recordset || [];
  } catch (error) {
    throw new Error('Error al obtener clientes legacy: ' + error.message);
  }
};

module.exports = { getClientes, getClientesLegacy };
