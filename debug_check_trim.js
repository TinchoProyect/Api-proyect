const { connectToDB, configDatosSQL } = require('./dbConfig');

async function checkTrim() {
    try {
        const pool = await connectToDB(configDatosSQL);
        console.log("Verificando espacios en blanco para NMELCHx5...");

        const result = await pool.request().query(`
            SELECT TOP 1
                c.numero,
                c.cod_cli_prov as cliente,
                k.articulo,
                LEN(k.articulo) as longitud,
                DATALENGTH(k.articulo) as datalength,
                CAST(k.articulo as varbinary(max)) as hex,
                k.cantidad
            FROM dbo.listado_kardex k
            JOIN dbo.comprobantes c ON k.codigo = c.codigo AND k.comprobante = c.numero
            WHERE k.articulo LIKE '%NMELCHx5%' AND c.cod_cli_prov = 13
        `);

        console.log(JSON.stringify(result.recordset, null, 2));

        console.log("\n--- TEST DE COMPARACIÓN ---");
        // Test directo de la condicion que falla
        const test = await pool.request()
            .input('art', 'NMELCHx5')
            .query(`
                SELECT count(*) as match_exacto 
                FROM dbo.listado_kardex k
                JOIN dbo.comprobantes c ON k.codigo = c.codigo AND k.comprobante = c.numero
                WHERE k.articulo = @art AND c.cod_cli_prov = 13
            `);
        console.log("Match exacto SQL con 'NMELCHx5':", test.recordset[0].match_exacto);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkTrim();
