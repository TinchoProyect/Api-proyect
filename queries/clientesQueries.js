// queries/clientesQueries.js

const sql = require('mssql');

// Función para obtener la lista de clientes
const getClientes = async () => {
    try {
        const result = await sql.query(`
            SELECT 
    c.codigo AS 'Número',
    c.nombre AS 'Nombre',
    CASE c.lista_precio 
      WHEN 1 THEN 'Precio Neg.'
      WHEN 2 THEN 'Mayorista'
      WHEN 3 THEN 'Especia (Brus)'
      WHEN 4 THEN 'Consumidor Final'
      WHEN 5 THEN 'Lista 5'
      ELSE 'Desconocido'
    END AS 'Lista precios',
    tipos_iva.nombre AS 'Cond. IVA',
    zonas.nombre As 'Zona',
    c.apellido AS 'Apellido',
    c.otros AS 'Otros',
    c.cuit AS 'CUIT',
    empleados.apellido AS 'Vendedor',
    c.telefono2 AS 'Teléfono 2',
    c.telefono AS 'Teléfono',
    c.email AS 'E-Mail',
    c.celular AS 'Celular',
    c.cuenta_limite AS 'Límite cta.',
    c.fecha_nacimiento AS 'Nacimiento',
    localidades.nombre AS 'Localidad',
    provincias.nombre AS 'Provincia',
    paises.nombre AS 'País',
    c.dni AS 'DNI',
    c.domicilio AS 'Domicilio'
FROM 
    clientes c
LEFT JOIN
	tipos_iva ON C.condicion_iva = tipos_iva.codigo
LEFT JOIN	
	Zonas ON c.empresa = Zonas.empresa
LEFT JOIN
	empleados on C.empleado = empleados.codigo
LEFT JOIN
	localidades on c.localidad = localidades.codigo
LEFT JOIN
	provincias on c.provincia = provincias.codigo
LEFT JOIN
	paises on c.pais = paises.codigo
	
WHERE 
    c.eliminado = 0;
        `);
        return result.recordset;
    } catch (error) {
        throw new Error('Error al obtener los clientes: ' + error.message);
    }
};

module.exports = { getClientes };