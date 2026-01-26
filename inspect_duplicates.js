const { connectToDB, configDatosSQL } = require('./dbConfig');

async function inspectDuplicates() {
    try {
        const pool = await connectToDB(configDatosSQL);
        // Buscar comprobantes que compartan el número 121 para ver cómo se diferencian
        const result = await pool.request().query(`
            SELECT TOP 20 
                c.codigo, 
                c.tipo_comprobante, 
                tc.nombre as nombre_tipo,
                c.numero, 
                c.punto_venta, 
                c.cod_cli_prov,
                cl.nombre as cliente
            FROM dbo.comprobantes c
            LEFT JOIN dbo.tipos_comprobantes tc ON c.tipo_comprobante = tc.codigo
            LEFT JOIN dbo.clientes cl ON c.cod_cli_prov = cl.codigo
            WHERE c.numero = 121
            ORDER BY c.fecha DESC
        `);
        console.log(JSON.stringify(result.recordset, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

inspectDuplicates();
