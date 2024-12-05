const sql = require('mssql');

// Función para obtener los movimientos y detalles de un cliente específico
const getMovimientosYDetalles = async (clienteId) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request()
            .input('clienteId', sql.Int, clienteId)
            .query(`
                SELECT DISTINCT
    m.codigo AS 'Codigo_Movimiento',
    m.numero AS 'Numero_Movimiento',
    m.tipo_comprobante AS 'Tipo_Comprobante',
    tc.nombre AS 'Nombre_Comprobante',
    m.fecha AS 'Fecha_Movimiento',
    m.importe_neto AS 'Importe_Neto_Movimiento',
    m.importe_total AS 'Importe_Total_Movimiento',
    k.articulo AS 'Articulo_Detalle',
    k.descripcion AS 'Descripcion_Detalle',
    k.cantidad AS 'Cantidad_Detalle',
    k.punto_venta AS 'Punto_Venta_Detalle',
    -- Columna "efectivo" agregada
    CASE
        WHEN (cm.comentario LIKE 'RB X 00%' OR
              cm.comentario LIKE 'RB A 00%' OR
              cm.comentario LIKE 'RB B 00%' OR
              cm.comentario LIKE 'RB M 00%')
        AND cm.comentario LIKE '%' + CAST(m.numero AS VARCHAR) + '%'
        THEN 'Efectivo'
        ELSE NULL
    END AS 'Efectivo'
FROM 
    dbo.comprobantes m
LEFT JOIN 
    dbo.listado_kardex k 
ON 
    m.codigo = k.codigo 
AND 
    m.numero = k.comprobante
LEFT JOIN 
    dbo.tipos_comprobantes tc 
ON 
    m.tipo_comprobante = tc.codigo
LEFT JOIN 
    dbo.caja_movimiento cm
ON 
    m.codigo = cm.asoc_codigo
WHERE 
    m.cod_cli_prov = @clienteId  -- Filtrar por cliente
AND 
    m.estado = 0  -- Solo registros activos
AND 
    m.tipo_comprobante NOT IN (19, 28)     
AND 
    m.fecha >= '2024-06-01'    
ORDER BY 
    m.fecha DESC;
            `);
        
        return result.recordset;
    } catch (error) {
        throw new Error('Error al obtener los movimientos y detalles: ' + error.message);
    }
};

module.exports = { getMovimientosYDetalles };