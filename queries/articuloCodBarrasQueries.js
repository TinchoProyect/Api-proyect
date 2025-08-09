const sql = require('mssql');

// Función para obtener número, nombre, código de barras y stock total de artículos activos
const getArticulosConCodigosBarras = async () => {
    try {
        const result = await sql.query(
            "SELECT ar.numero, ar.nombre, cb.codigo_barras, ROUND(SUM(st.cantidad), 3) AS stock_total " +
            "FROM articulos ar " +
            "INNER JOIN articulo_x_cod_barras cb ON cb.codigo_art = ar.codigo " +
            "LEFT JOIN stock st ON st.articulo = ar.codigo " +
            "WHERE ar.eliminado = 0 " +
            "AND ar.sucursal = 0 " +
            "AND st.sucursal = 0 " +
            "GROUP BY ar.codigo, ar.numero, ar.nombre, cb.codigo_barras " +
            "ORDER BY ar.nombre ASC;"
        );
        return result.recordset;
    } catch (error) {
        throw new Error('Error al obtener artículos con códigos de barras: ' + error.message);
    }
};

module.exports = { getArticulosConCodigosBarras };