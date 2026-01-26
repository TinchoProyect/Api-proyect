const { connectToDB, configDatosSQL } = require('./dbConfig');

async function debugDevolucion() {
    try {
        const pool = await connectToDB(configDatosSQL);
        // Búsqueda amplia para el cliente 13 y artículo parecido a NMELCHx5
        // Sin filtro de fecha estricto para ver si está fuera del rango
        console.log("Buscando registros para Cliente 13 y Articulo 'NMELCHx5'...");

        const result = await pool.request().query(`
            SELECT TOP 10
                c.fecha,
                c.numero AS numero_comprobante,
                tc.nombre AS tipo_comprobante,
                c.cod_cli_prov AS cliente_id,
                k.articulo AS codigo_articulo,
                k.cantidad,
                c.estado
            FROM dbo.comprobantes c
            INNER JOIN dbo.tipos_comprobantes tc ON c.tipo_comprobante = tc.codigo
            INNER JOIN dbo.listado_kardex k ON c.codigo = k.codigo AND c.numero = k.comprobante
            WHERE 
                c.cod_cli_prov = 13
                AND k.articulo LIKE '%NMELCHx5%'
                AND (tc.nombre LIKE 'N/C%' OR tc.descripcion LIKE '%Nota de Credito%')
            ORDER BY c.fecha DESC
        `);

        console.log(JSON.stringify(result.recordset, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

debugDevolucion();
