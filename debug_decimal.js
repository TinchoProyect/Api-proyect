const { connectToDB, configDatosSQL } = require('./dbConfig');
const sql = require('mssql');

async function debugDecimal() {
    try {
        const pool = await connectToDB(configDatosSQL);
        const cantString = '1.000';

        console.log(`Probando filtro con cantidad string: '${cantString}'`);

        const result = await pool.request()
            .input('cantidad', sql.Decimal(18, 2), cantString)
            .query(`
                SELECT TOP 5 
                    k.articulo, 
                    k.cantidad, 
                    ABS(k.cantidad) as abs_cantidad
                FROM dbo.listado_kardex k
                JOIN dbo.comprobantes c ON k.codigo = c.codigo AND k.comprobante = c.numero
                WHERE 
                    c.cod_cli_prov = 13 
                    AND k.articulo = 'NMELCHx5'
                    AND ABS(k.cantidad) = @cantidad
            `);

        console.log("Resultados encontrados:", result.recordset.length);
        console.log(JSON.stringify(result.recordset, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

debugDecimal();
