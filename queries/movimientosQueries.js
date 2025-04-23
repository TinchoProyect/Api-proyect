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
    codigo,
    cod_cli_prov,
    tipo_comprobante,
    nombre_comprobante,
    numero,
    fecha,
    importe_neto,
    fecha_vto,
    fecha_comprobante,
    importe_total,
    comentario,
    estado,
    -- Limpiar valores combinados y manejar las barras
    CASE
        WHEN efectivo_raw IS NULL THEN NULL
        ELSE LTRIM(
            CASE 
                WHEN efectivo_raw LIKE 'Efectivo%' AND efectivo_raw LIKE '%/ Cheque%' THEN efectivo_raw
                WHEN efectivo_raw LIKE 'Efectivo%' AND efectivo_raw LIKE '%/ Transferencia%' THEN efectivo_raw
                WHEN efectivo_raw LIKE '%Cheque%' AND efectivo_raw LIKE '%Transferencia%' THEN efectivo_raw
                ELSE REPLACE(efectivo_raw, '/', '')
            END
        )
    END AS efectivo
FROM CTE
WHERE fila = 1  -- Solo mantener una fila por cada 'c.codigo'
ORDER BY fecha;
            `);
        return result.recordset;
    } catch (error) {
        throw new Error('Error al obtener los movimientos: ' + error.message);
    }
};
// Aquí se exporta la función para que pueda ser utilizada en otros archivos, como index.js
module.exports = { getMovimientosPorCliente };