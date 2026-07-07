DROP SCHEMA IF EXISTS "Inventario";
CREATE SCHEMA IF NOT EXISTS "Inventario";


-- Tabla Categoria
CREATE TABLE "Categoria"(

	"ID_Categoria" BIGSERIAL PRIMARY KEY, 
	"Nombre_Categoria" VARCHAR(100) NOT NULL UNIQUE
	);

-- Tabla Insumos 
CREATE TABLE "Insumos"(

	"ID_Insumos" BIGSERIAL PRIMARY KEY, 
	"Nombre_Insumo" VARCHAR(100) NOT NULL UNIQUE, 
	
	"Unidad_Medida" VARCHAR(20) NOT NULL, 
	"Stock_Actual"  NUMERIC(12,4) NOT NULL DEFAULT 0,
	
	"Stock_Minimo" NUMERIC(12,4) NOT NULL DEFAULT 0, 
	"Punto_Reorden" NUMERIC (12,4) NOT NULL, 
	
	"FK_IDCategoria" BIGINT, 
	CONSTRAINT "FK_idcategoria" FOREIGN KEY ("FK_IDCategoria") REFERENCES "Categoria" ("ID_Categoria")

);

-- Tabla Proveedores
CREATE TABLE "Proveedores" (

	"ID_Proveedor" BIGSERIAL PRIMARY KEY,
	"Nombre_Empresa" VARCHAR(150) NOT NULL,
	
	"Identificación_RIF" VARCHAR(30) NOT NULL UNIQUE, 
	"Ciudad" VARCHAR(100) NOT NULL,
	
	"Telefono_Empresa" VARCHAR(30) NOT NULL,
	"Email_Empresa" VARCHAR(100) NOT NULL UNIQUE,
	
	"Direccion" VARCHAR(255) NOT NULL,
	"Nombre_Encargado" VARCHAR NOT NULL

);

-- Tabla Proveedores_Insumo 
CREATE TABLE "Proveedores_Insumo"(

	
	"ID_OrdenCompra" BIGSERIAL PRIMARY KEY, 
	"Fecha_Emisión" DATE DEFAULT CURRENT_DATE,
	
	"FK_IDProveedor" BIGINT NOT NULL,
	"FK_IDInsumos" BIGINT NOT NULL,
	
	"Costo_Unitario" NUMERIC(12,4) NOT NULL, 
	"Cantidad_Pedido" NUMERIC(12,4) NOT NULL,
	"Tiempo_Entrega_dias" INTEGER NOT NULL,
	
	"Encargado_Despacho" VARCHAR(100),
	"Telefono_EncargadoD" VARCHAR(30),
    
	"Estado_Envio" VARCHAR(20) DEFAULT 'En Proceso' CHECK("Estado_Envio" IN ('En Proceso','En camino','Recibido')), 
	"Observaciones" TEXT, 
    
	CONSTRAINT "FK_idproveedor" FOREIGN KEY ("FK_IDProveedor") REFERENCES "Proveedores" ("ID_Proveedor"),
	CONSTRAINT "FK_idinsumo" FOREIGN KEY ("FK_IDInsumos") REFERENCES "Insumos" ("ID_Insumos")
);

