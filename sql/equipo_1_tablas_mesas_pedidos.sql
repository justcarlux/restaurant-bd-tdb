-- Debido a cómo funciona PostgreSQL (no existe el comando USE como en MySQL), la base de datos se debe seleccionar de antemano y este script se debe ejecutar dentro de la misma
-- Por ejemplo, en DBeaver, es necesario seleccionar la base de datos y después ejecutar el script

-- Crear los tipos (o enums) correspondientes

CREATE TYPE estado_mesa AS ENUM ('disponible', 'ocupada', 'reservada', 'fuera_de_servicio');
CREATE TYPE tipo_pedido AS ENUM ('mesa', 'pickup', 'delivery');
CREATE TYPE estado_orden AS ENUM ('recibido', 'preparando', 'listo', 'entregado');
CREATE TYPE categoria_plato AS ENUM ('entrada', 'plato_principal', 'postre', 'bebida', 'acompañante');

-- Crear la tabla "mesa"
-- Se encarga de mantener registro de las mesas del restaurante y su estado actual.
-- - Columna "id_mesa" que acepta un entero no nulo autoincremental. Marcada como la llave primaria de la tabla
-- - Columna "capacidad" que acepta un entero no nulo
-- - Columna "estado" que puede aceptar uno de 4 valores (no nulo): 'disponible', 'ocupada', 'reservada' y 'fuera_de_servicio'. Por defecto, tendrá el valor de 'disponible'
-- - Columna "ubicacion" que acepta una cadena variable de longitud máxima de 100. Permite nulos

CREATE TABLE IF NOT EXISTS mesa (
    id_mesa SERIAL PRIMARY KEY,
    capacidad INT NOT NULL,
    estado estado_mesa NOT NULL DEFAULT 'disponible',
    ubicacion VARCHAR(100)
);

-- Crear la tabla "plato"
-- Se encarga de mantener registro de los platos disponibles en el menú del restaurante.
-- - Columna "id_plato" que acepta un entero no nulo autoincremental. Marcada como la llave primaria de la tabla
-- - Columna "nombre" que acepta una cadena variable de longitud máxima de 100 no nula
-- - Columna "descripcion" que acepta una cadena variable de longitud máxima de 255. Permite nulos
-- - Columna "precio" que acepta un decimal de 8 dígitos con 2 decimales no nulo
-- - Columna "categoria" que puede aceptar uno de 5 valores (no nulo): 'entrada', 'plato_principal', 'postre', 'bebida' y 'acompañante'

CREATE TABLE IF NOT EXISTS plato (
    id_plato SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    precio DECIMAL(8,2) NOT NULL,
    categoria categoria_plato NOT NULL
);

-- Crear la tabla "pedido"
-- Se encarga de mantener registro de los pedidos del restaurante, su tipo y su estado actual.
-- - Columna "num_ticket" que acepta un entero no nulo autoincremental. Marcada como la llave primaria de la tabla
-- - Columna "tipo_pedido" que puede aceptar uno de 3 valores (no nulo): 'mesa', 'pickup' y 'delivery'
-- - Columna "estado_orden" que puede aceptar uno de 4 valores (no nulo): 'recibido', 'preparando', 'listo' y 'entregado'. Por defecto, tendrá el valor de 'recibido'
-- - Columna "id_mesa" que acepta un entero. Permite nulos si el pedido es de tipo 'pickup' o 'delivery'
-- - Columna "cedula_cliente" que acepta una cadena variable de longitud máxima de 20 no nula
-- - Columna "direccion_envio" que acepta una cadena variable de longitud máxima de 255. Permite nulos si el pedido no es de tipo 'delivery' (gracias a "chk_direccion_envio"), si el pedido es "delivery" deberá tener un valor declarado
-- Relación: La columna "id_mesa" es marcada como llave foránea, haciendo referencia a la columna "id_mesa" de la tabla "mesa"

CREATE TABLE IF NOT EXISTS pedido (
    num_ticket SERIAL PRIMARY KEY,
    tipo_pedido tipo_pedido NOT NULL,
    estado_orden estado_orden NOT NULL DEFAULT 'recibido',
    id_mesa INT,
    cedula_cliente VARCHAR(20) NOT NULL,
    direccion_envio VARCHAR(255),
    FOREIGN KEY (id_mesa) REFERENCES mesa(id_mesa),
    CONSTRAINT chk_direccion_envio CHECK (
        tipo_pedido != 'delivery' OR direccion_envio IS NOT NULL
    )
);

-- Crear la tabla "detalle_pedido"
-- Se encarga de registrar los platos individuales que componen cada pedido, resolviendo la relación N:M entre pedido y plato.
-- - Columna "num_ticket" que acepta un entero no nulo
-- - Columna "id_plato" que acepta un entero no nulo
-- - Columna "cantidad" que acepta un entero no nulo
-- - Columna "subtotal" que acepta un decimal de 8 dígitos con 2 decimales no nulo
-- La llave primaria es compuesta por las columnas "num_ticket" e "id_plato"
-- Relación: La columna "num_ticket" es marcada como llave foránea, haciendo referencia a la columna "num_ticket" de la tabla "pedido"
-- Relación: La columna "id_plato" es marcada como llave foránea, haciendo referencia a la columna "id_plato" de la tabla "plato"

CREATE TABLE IF NOT EXISTS detalle_pedido (
    num_ticket INT NOT NULL,
    id_plato INT NOT NULL,
    cantidad INT NOT NULL,
    subtotal DECIMAL(8,2) NOT NULL,
    PRIMARY KEY (num_ticket, id_plato),
    FOREIGN KEY (num_ticket) REFERENCES pedido(num_ticket),
    FOREIGN KEY (id_plato) REFERENCES plato(id_plato)
);