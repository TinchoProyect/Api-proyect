// queries/artXartQueries.js

const sql = require('mssql');

// Función para obtener todos los registros de la tabla art_x_art
const getArticulosAsociados = async () => {
    try {
        const result = await sql.query(`
            SELECT * FROM dbo.art_x_art
        `);
        return result.recordset;
    } catch (error) {
        throw new Error('Error al obtener los artículos asociados: ' + error.message);
    }
};

module.exports = { getArticulosAsociados };