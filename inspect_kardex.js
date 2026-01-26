const { connectToDB, configDatosSQL } = require('./dbConfig');

async function inspectKardex() {
    try {
        const pool = await connectToDB(configDatosSQL);
        const result = await pool.request().query("SELECT TOP 1 * FROM dbo.listado_kardex");
        console.log(JSON.stringify(result.recordset, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

inspectKardex();
