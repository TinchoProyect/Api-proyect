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
    -- Columna "Efectivo" ajustada para manejar FE, FB y MOV.CLI
    CASE
        WHEN tc.nombre IN ('FE', 'FB') THEN NULL -- Excepción para Nombre_Comprobante FE y FB
        WHEN tc.nombre = 'Mov. Cli.' THEN 'Aj.Manual' -- Excepción para ajustes manuales
        WHEN k.punto_venta = 7 THEN NULL -- Es una factura, no modificar
        WHEN k.punto_venta IS NULL THEN
            CASE
                WHEN (
                    SELECT COUNT(*) 
                    FROM dbo.comp_x_forma_pago cxp
                    WHERE cxp.codigo_comp = m.codigo AND cxp.tipo = 1
                ) > 0 THEN 'Efectivo'
                WHEN (
                    SELECT COUNT(*) 
                    FROM dbo.comp_x_forma_pago cxp
                    WHERE cxp.codigo_comp = m.codigo AND cxp.tipo = 3
                ) = 1 THEN 'Cheque'
                WHEN (
                    SELECT COUNT(*) 
                    FROM dbo.comp_x_forma_pago cxp
                    WHERE cxp.codigo_comp = m.codigo AND cxp.tipo = 3
                ) > 1 THEN 'Cheques'
                WHEN (
                    SELECT COUNT(*) 
                    FROM dbo.comp_x_forma_pago cxp
                    WHERE cxp.codigo_comp = m.codigo AND cxp.tipo = 8
                ) = 1 THEN 'Transferencia'
                WHEN (
                    SELECT COUNT(*) 
                    FROM dbo.comp_x_forma_pago cxp
                    WHERE cxp.codigo_comp = m.codigo AND cxp.tipo = 8
                ) > 1 THEN 'Transferencias'
                ELSE NULL
            END
        ELSE NULL -- Caso por defecto
    END AS 'Efectivo'
FROM 
    dbo.comprobantes m
LEFT JOIN 
    dbo.listado_kardex k 
    ON m.codigo = k.codigo AND m.numero = k.comprobante
LEFT JOIN 
    dbo.tipos_comprobantes tc 
    ON m.tipo_comprobante = tc.codigo
LEFT JOIN 
    dbo.caja_movimiento cm 
    ON m.codigo = cm.asoc_codigo
WHERE 
    m.cod_cli_prov = @clienteId  -- Filtrar por cliente
    AND m.estado = 0  -- Solo registros activos
    AND m.tipo_comprobante NOT IN (19, 28) -- Excluir tipos específicos
    AND m.fecha >= '2024-06-01'
ORDER BY 
    m.fecha DESC;
            `);
        
        return result.recordset;
    } catch (error) {
        throw new Error('Error al obtener los movimientos y detalles: ' + error.message);
    }
};

module.exports = { getMovimientosYDetalles };