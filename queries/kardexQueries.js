// queries/kardexQueries.js

const sql = require('mssql');

// Función para obtener la lista de Kardex
const getKardex = async () => {
    try {
        const result = await sql.query(`
            SELECT 
                k.articulo AS 'Artículo',
                k.descripcion AS 'Descripción',
                k.fecha AS 'Fecha',
                k.tipo AS 'Tipo Kardex',
                k.comprobante AS 'Comprobante',
                k.cantidad AS 'Cantidad',
                k.punto_venta AS 'Punto',
                k.codigo AS 'Código Kardex'
            FROM 
                [datosSQL].[dbo].[listado_kardex] k
            LEFT JOIN 
                [datosSQL].[dbo].[comprobantes] c
            ON 
                k.codigo = c.codigo
            AND 
                k.comprobante = c.numero
            WHERE 
                c.estado = 0  -- Filtrar por registros activos
            AND 
                k.fecha >= '2024-06-01'
            ORDER BY 
                k.fecha;
        `);
        return result.recordset;
    } catch (error) {
        throw new Error('Error al obtener los datos de Kardex: ' + error.message);
    }
};

module.exports = { getKardex };
