const sql = require('mssql');
const { connectToDB, configDatosSQL } = require('../dbConfig');

// Función para obtener las notas de crédito por devolución de artículos
// Función para obtener las notas de crédito por devolución de artículos con filtros específicos
// Parámetros: clienteId (int), articuloCode (string), fechaReference (string YYYY-MM-DD), cantidad (decimal)
const getDevolucionesArticulos = async (clienteId, articuloCode, fechaReference, cantidad) => {
    try {
        const pool = await connectToDB(configDatosSQL);
        const request = pool.request();

        let query = `
            SELECT 
                c.fecha,
                c.numero AS numero_comprobante,
                c.punto_venta,
                tc.nombre AS tipo_comprobante,
                cl.nombre AS cliente,
                k.articulo AS codigo_articulo,
                k.descripcion AS articulo,
                k.cantidad,
                c.importe_neto
            FROM dbo.comprobantes c
            INNER JOIN dbo.tipos_comprobantes tc ON c.tipo_comprobante = tc.codigo
            INNER JOIN dbo.listado_kardex k ON c.codigo = k.codigo AND c.numero = k.comprobante
            LEFT JOIN dbo.clientes cl ON c.cod_cli_prov = cl.codigo
            WHERE 
                tc.compra = 0 
                AND c.estado = 0
                AND (tc.nombre LIKE 'N/C%' OR tc.descripcion LIKE '%Nota de Credito%')
                AND k.articulo IS NOT NULL
        `;

        // Aplicar filtros si se reciben los parámetros (Lógica solicitada para la API externa)
        if (clienteId && articuloCode && fechaReference && cantidad) {
            request.input('clienteId', sql.Int, clienteId);
            request.input('articuloCode', sql.VarChar, articuloCode);
            request.input('fechaRef', sql.Date, fechaReference);
            request.input('cantidad', sql.Decimal(18, 2), cantidad);

            // Lógica: 1 MES hacia atrás desde la fecha recibida
            // Buscamos coincidencia exacta en Cliente, Articulo, Cantidad y rango de fecha
            query += `
                AND c.cod_cli_prov = @clienteId
                AND k.articulo = @articuloCode
                AND ABS(k.cantidad) = @cantidad
                AND c.fecha BETWEEN DATEADD(month, -1, @fechaRef) AND DATEADD(day, 1, @fechaRef)
            `;
        } else {
            // Comportamiento default (histórico 1 año) si no hay parámetros específicos
            query += ` AND c.fecha >= DATEADD(year, -1, GETDATE()) `;
        }

        query += ` ORDER BY c.fecha DESC`;

        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        throw new Error('Error al obtener devoluciones: ' + error.message);
    }
};

module.exports = { getDevolucionesArticulos };
