-- Equipo 2 - Core Financiero (Ventas)
-- Sistema de Restaurante - Proyecto Final
-- En éste script simplemente se detallaran las tablas asociadas a nuestro equipo con sus atributos, claves primarias y foráneas


-- Lo primero que hacemos es crear los tipos (enums), el Equipo 1 ya creó los tipos estado_orden y tipo_pedido

CREATE TYPE estado_pago AS ENUM ('pendiente', 'pagado', 'anulado');

-- Ahora se crea la tabla "cliente"
-- Se encarga de mantener registro de los clientes del restaurante y sus datos de contacto.
-- Llave primaria de la tabla "cedula_cliente", maximo 20 caracteres no nulos, es VARCHAR y no INT por si se desea poner puntos entre los números y sea más sencillo de leer, ejm: 40.500.000
-- Atributo "nombre" donde se debe indicar el nombre del cliente con una longitud máxima de 100 caracteres no nulos
-- Atributo "telefono" donde se debe colocar el número telefónico del cliente, máximo 20 caracteres no nulos, VARCHAR en vez de INT por si se desea colocar símbolos para que sea más sencillo de leer, ejm: +58 416-1077895
-- Atributo "email" donde se debe colocar la dirección del correo electrónico del cliente, máximo 100 caracteres, permite nulos
-- Atributo "direccion_habitual" donde se debe colocar la dirección del cliente por si desea hacer un delivery, permite nulos, dependerá del caso

CREATE TABLE IF NOT EXISTS cliente(

    cedula_cliente VARCHAR(20) PRIMARY KEY,       
    nombre VARCHAR(100) NOT NULL,                  
    telefono VARCHAR(20) NOT NULL,                 
    email VARCHAR(100),                            
    direccion_habitual VARCHAR(255)                
);


--  Ahora añadimos una clave foránea a la lista "Pedido" ya creada por el Equipo 1, se agrega porque la tabla "Cliente" no existia cuando se creó la tabla "Pedido"

ALTER TABLE pedido
    ADD CONSTRAINT fk_pedido_cliente
    FOREIGN KEY (cedula_cliente)
    REFERENCES cliente (cedula_cliente);


-- Se crea la tabla "factura"
-- Se encarga de mantener registro de las facturas generadas a partir de cada pedido, junto con su estado de pago.
-- Llave primaria "num_factura" de la tabla, acepta un entero no nulo autoincremental
-- Atributo "num_ticket" que acepta enteros no nulos, debe ser única
-- Atributo "fecha_emision" que acepta una marca de tiempo no nula, por defecto, tendrá la fecha y hora actual
-- Atributo "subtotal" que acepta un decimal de 8 dígitos con 2 decimales no nulo, debe ser mayor o igual a 0
-- Atributo "impuesto" que acepta un decimal de 8 dígitos con 2 decimales no nulo. por defecto tendrá el valor de 0, y puede ser mayor o igual a 0
-- Atributo "total" que acepta un decimal de 8 dígitos con 2 decimales no nulo, debe ser mayor o igual a 0
-- Atributo "estado_pago" que puede aceptar uno de 3 valores (no nulos): 'pendiente', 'pagado' y 'anulado', por defecto tendrá el valor de 'pendiente'
-- Atributo "metodo_pago" que acepta una cadena variable de longitud máxima de 30, permite nulos 
-- El atributo "num_ticket" es marcada como llave foránea, haciendo referencia a la columna "num_ticket" de la tabla "pedido"

CREATE TABLE IF NOT EXISTS factura(

    num_factura SERIAL PRIMARY KEY,                                   
    num_ticket INT NOT NULL UNIQUE,                                    
    fecha_emision TIMESTAMP NOT NULL DEFAULT NOW(),
    subtotal DECIMAL(8,2) NOT NULL CHECK (subtotal >= 0),
    impuesto DECIMAL(8,2) NOT NULL DEFAULT 0 CHECK (impuesto >= 0),
    total DECIMAL(8,2) NOT NULL CHECK (total >= 0),
    estado_pago estado_pago NOT NULL DEFAULT 'pendiente',
    metodo_pago VARCHAR(30),
    FOREIGN KEY (num_ticket) REFERENCES pedido (num_ticket)
);