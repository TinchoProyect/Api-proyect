const sql = require('mssql');

// Función para obtener todos los registros de la tabla Artículos
const getArticulos = async () => {
    try {
        const result = await sql.query(`
            SELECT 
                codigo,
                fecha_creado,
                enviado,
                precio2,
                precio1,
                precio3,
                familia,
                descuento,
                iva,
                nombre,
                descripcion,
                cod_unidad_medida,
                costo,
                minimo,
                numero,
                no_stock,
                moneda,
                defecto,
                eliminado,
                precio4,
                precio5,
                gan1,
                gan2,
                gan3,
                gan4,
                gan5,
                maximo,
                mantener_gan,
                subfamilia,
                compuesto,
                parametro_2,
                parametro_4,
                cod_iva
            FROM dbo.articulos
        `);
        return result.recordset;
    } catch (error) {
        throw new Error('Error al obtener los artículos: ' + error.message);
    }
};

module.exports = { getArticulos };