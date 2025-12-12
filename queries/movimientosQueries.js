const sql = require('mssql');

// Función para obtener los movimientos de un cliente específico
const getMovimientosPorCliente = async (clienteId) => {
    try {
        console.log(`clienteId para la consulta: ${clienteId}`);  // Log para verificar el clienteId
        const pool = await sql.connect();  // Asegurarse de que la conexión esté abierta
        const result = await pool.request()
            .input('clienteId', sql.Int, clienteId)  // Asegurarse de pasar el parámetro correctamente
            .query(`
                WITH CTE AS (
    SELECT 
        c.codigo,
        c.cod_cli_prov,
        c.tipo_comprobante,
        tc.nombre AS nombre_comprobante,
        c.numero,
        c.fecha,
        c.importe_neto,
        c.fecha_vto,
        c.fecha_comprobante,
        c.importe_total,
        c.comentario,
        c.estado,
        cm.comentario AS comentario_movimiento,
        -- Determinar los valores individuales solo para registros procesables
        CASE
            WHEN tc.nombre IN ('FE', 'FB', 'FA', 'Mov. Cli.', 'N/C A', 'N/C E', 'N/C B') THEN NULL
            ELSE (
                CASE
                    -- Verificar si existe efectivo
                    WHEN EXISTS (
                        SELECT 1
                        FROM dbo.comp_x_forma_pago cxp
                        WHERE cxp.codigo_comp = c.codigo AND cxp.tipo = 1
                    ) THEN 'Efectivo'
                    ELSE ''
                END +
                CASE
                    -- Verificar si es cheque en singular o plural
                    WHEN EXISTS (
                        SELECT 1
                        FROM dbo.comp_x_forma_pago cxp
                        WHERE cxp.codigo_comp = c.codigo AND cxp.tipo = 3
                    ) THEN 
                        CASE 
                            WHEN (
                                SELECT COUNT(*)
                                FROM dbo.comp_x_forma_pago cxp
                                WHERE cxp.codigo_comp = c.codigo AND cxp.tipo = 3
                            ) = 1 THEN ' / Cheque'
                            ELSE 
                                ' / ' + CAST((
                                    SELECT COUNT(*)
                                    FROM dbo.comp_x_forma_pago cxp
                                    WHERE cxp.codigo_comp = c.codigo AND cxp.tipo = 3
                                ) AS VARCHAR) + ' Cheques'
                        END
                    ELSE ''
                END +
                CASE
                    -- Verificar si es transferencia en singular o plural
                    WHEN EXISTS (
                        SELECT 1
                        FROM dbo.comp_x_forma_pago cxp
                        WHERE cxp.codigo_comp = c.codigo AND cxp.tipo = 8
                    ) THEN 
                        CASE 
                            WHEN (
                                SELECT COUNT(*)
                                FROM dbo.comp_x_forma_pago cxp
                                WHERE cxp.codigo_comp = c.codigo AND cxp.tipo = 8
                            ) = 1 THEN ' / Transferencia'
                            ELSE 
                                ' / ' + CAST((
                                    SELECT COUNT(*)
                                    FROM dbo.comp_x_forma_pago cxp
                                    WHERE cxp.codigo_comp = c.codigo AND cxp.tipo = 8
                                ) AS VARCHAR) + ' Transferencias'
                        END
                    ELSE ''
                END
            )
        END AS efectivo_raw,
        -- Asignar un número de fila a cada grupo de 'c.codigo'
        ROW_NUMBER() OVER (PARTITION BY c.codigo ORDER BY c.fecha DESC) AS fila
    FROM 
        dbo.comprobantes c
    LEFT JOIN 
        dbo.tipos_comprobantes tc ON c.tipo_comprobante = tc.codigo
    LEFT JOIN 
        dbo.caja_movimiento cm ON c.codigo = cm.asoc_codigo
    WHERE 
        c.cod_cli_prov = @clienteId  -- Filtrar por el cliente
        AND c.fecha >= '2024-06-01' 
        AND c.tipo_comprobante IN (8, 15, 4, 6, 7, 3, 2, 1, 5, -3, 14, 16, 17, 18, 36, 30)
        AND c.estado = 0  -- Filtrar solo los registros activos
    GROUP BY 
        c.codigo, c.cod_cli_prov, c.tipo_comprobante, tc.nombre, c.numero, c.fecha, 
        c.importe_neto, c.fecha_vto, c.fecha_comprobante, c.importe_total, c.comentario, c.estado,
        cm.comentario
)
SELECT 
    CTE.codigo,
    CTE.cod_cli_prov,
    CTE.tipo_comprobante,
    CTE.nombre_comprobante,
    CTE.numero,
    CTE.fecha,
    CTE.importe_neto,
    CTE.fecha_vto,
    CTE.fecha_comprobante,
    CTE.importe_total,
    CTE.comentario,
    CTE.estado,
    -- Limpiar valores combinados y manejar las barras
    CASE
        WHEN CTE.efectivo_raw IS NULL THEN NULL
        ELSE LTRIM(
            CASE 
                WHEN CTE.efectivo_raw LIKE 'Efectivo%' AND CTE.efectivo_raw LIKE '%/ Cheque%' THEN CTE.efectivo_raw
                WHEN CTE.efectivo_raw LIKE 'Efectivo%' AND CTE.efectivo_raw LIKE '%/ Transferencia%' THEN CTE.efectivo_raw
                WHEN CTE.efectivo_raw LIKE '%Cheque%' AND CTE.efectivo_raw LIKE '%Transferencia%' THEN CTE.efectivo_raw
                ELSE REPLACE(CTE.efectivo_raw, '/', '')
            END
        )
    END AS efectivo
FROM CTE
WHERE 
    CTE.fila = 1
    AND NOT EXISTS (
        SELECT 1
        FROM dbo.comp_x_forma_pago cxp
        INNER JOIN dbo.caja_movimiento cm2
            ON cm2.codigo = cxp.codigo_fp
        WHERE 
            cxp.codigo_comp = CTE.codigo
            AND cm2.comentario LIKE 'FA 0007%'  -- movimiento de caja que marca contado en PV 7
    )
ORDER BY CTE.fecha;
            `);
        return result.recordset;
    } catch (error) {
        throw new Error('Error al obtener los movimientos: ' + error.message);
    }
};
// Aquí se exporta la función para que pueda ser utilizada en otros archivos, como index.js
module.exports = { getMovimientosPorCliente };