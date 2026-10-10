-- =====================================================================
-- CoreInventory - Esquema PostgreSQL para Supabase
-- Coincide con los modelos Sequelize de server/src/models
-- Ejecutar UNA sola vez en una base de datos vacia (SQL Editor de Supabase)
-- =====================================================================

-- ---------- Tipos ENUM ----------
CREATE TYPE "enum_Users_role" AS ENUM ('admin', 'manager', 'staff');
CREATE TYPE "enum_WarehouseLocations_type" AS ENUM ('input', 'quality', 'stock', 'output', 'packing', 'custom');
CREATE TYPE "enum_StockMoves_type" AS ENUM ('receipt', 'delivery', 'transfer', 'adjustment');
CREATE TYPE "enum_StockMoves_status" AS ENUM ('draft', 'waiting', 'ready', 'done', 'cancelled');

-- ---------- 1. Users ----------
CREATE TABLE "Users" (
    "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"                  VARCHAR(255) NOT NULL,
    "email"                 VARCHAR(255) NOT NULL UNIQUE,
    "password"              VARCHAR(255) NOT NULL,
    "role"                  "enum_Users_role" DEFAULT 'staff',
    "avatar"                VARCHAR(255) DEFAULT '',
    "profilePicture"        VARCHAR(255),
    "phoneNumber"           VARCHAR(255),
    "dateOfBirth"           DATE,
    "address"               TEXT,
    "department"            VARCHAR(255),
    "jobTitle"              VARCHAR(255),
    "bio"                   TEXT,
    "resetOtp"              VARCHAR(255),
    "resetOtpExpiry"        TIMESTAMP WITH TIME ZONE,
    "verificationOtp"       VARCHAR(255),
    "verificationOtpExpiry" TIMESTAMP WITH TIME ZONE,
    "isVerified"            BOOLEAN DEFAULT false,
    "isActive"              BOOLEAN DEFAULT true,
    "createdAt"             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt"             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ---------- 2. Warehouses ----------
CREATE TABLE "Warehouses" (
    "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"      VARCHAR(255) NOT NULL,
    "code"      VARCHAR(255) NOT NULL UNIQUE,
    "address"   VARCHAR(255) DEFAULT '',
    "isActive"  BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ---------- 3. WarehouseLocations ----------
CREATE TABLE "WarehouseLocations" (
    "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"        VARCHAR(255) NOT NULL,
    "code"        VARCHAR(255) NOT NULL,
    "type"        "enum_WarehouseLocations_type" DEFAULT 'stock',
    "WarehouseId" UUID REFERENCES "Warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ---------- 4. Categories ----------
CREATE TABLE "Categories" (
    "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"        VARCHAR(255) NOT NULL UNIQUE,
    "description" VARCHAR(255) DEFAULT '',
    "parentId"    UUID REFERENCES "Categories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ---------- 5. Products ----------
CREATE TABLE "Products" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"          VARCHAR(255) NOT NULL,
    "sku"           VARCHAR(255) NOT NULL UNIQUE,
    "description"   TEXT DEFAULT '',
    "uom"           VARCHAR(255) DEFAULT 'Units',
    "costPrice"     DECIMAL(10,2) DEFAULT 0,
    "salePrice"     DECIMAL(10,2) DEFAULT 0,
    "minStockLevel" INTEGER DEFAULT 0,
    "reorderQty"    INTEGER DEFAULT 0,
    "image"         VARCHAR(255) DEFAULT '',
    "isActive"      BOOLEAN DEFAULT true,
    "categoryId"    UUID REFERENCES "Categories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ---------- 6. ProductStocks ----------
CREATE TABLE "ProductStocks" (
    "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "locationName" VARCHAR(255) NOT NULL,
    "quantity"     INTEGER DEFAULT 0,
    "ProductId"    UUID REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "WarehouseId"  UUID REFERENCES "Warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "createdAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ---------- 7. StockMoves ----------
CREATE TABLE "StockMoves" (
    "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "reference"       VARCHAR(255) NOT NULL UNIQUE,
    "type"            "enum_StockMoves_type" NOT NULL,
    "status"          "enum_StockMoves_status" DEFAULT 'draft',
    "partner"         VARCHAR(255) DEFAULT '',
    "fromLocation"    VARCHAR(255) DEFAULT '',
    "toLocation"      VARCHAR(255) DEFAULT '',
    "scheduledDate"   TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "validatedDate"   TIMESTAMP WITH TIME ZONE,
    "notes"           TEXT DEFAULT '',
    "fromWarehouseId" UUID REFERENCES "Warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "toWarehouseId"   UUID REFERENCES "Warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdById"     UUID REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "validatedById"   UUID REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdAt"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ---------- 8. StockMoveLines ----------
CREATE TABLE "StockMoveLines" (
    "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "productName" VARCHAR(255),
    "sku"         VARCHAR(255),
    "demandQty"   INTEGER NOT NULL,
    "doneQty"     INTEGER DEFAULT 0,
    "uom"         VARCHAR(255) DEFAULT 'Units',
    "StockMoveId" UUID REFERENCES "StockMoves"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "ProductId"   UUID REFERENCES "Products"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ---------- Indices para consultas y analitica ----------
CREATE INDEX idx_wl_warehouse        ON "WarehouseLocations"("WarehouseId");
CREATE INDEX idx_categories_parent   ON "Categories"("parentId");
CREATE INDEX idx_products_category   ON "Products"("categoryId");
CREATE INDEX idx_ps_product          ON "ProductStocks"("ProductId");
CREATE INDEX idx_ps_warehouse        ON "ProductStocks"("WarehouseId");
CREATE INDEX idx_sm_type_status      ON "StockMoves"("type", "status");
CREATE INDEX idx_sm_scheduled        ON "StockMoves"("scheduledDate");
CREATE INDEX idx_sm_from_wh          ON "StockMoves"("fromWarehouseId");
CREATE INDEX idx_sm_to_wh            ON "StockMoves"("toWarehouseId");
CREATE INDEX idx_sm_created_by       ON "StockMoves"("createdById");
CREATE INDEX idx_sml_move            ON "StockMoveLines"("StockMoveId");
CREATE INDEX idx_sml_product         ON "StockMoveLines"("ProductId");

-- ---------- Seguridad (Supabase) ----------
-- Activa RLS sin politicas: bloquea el acceso publico por la API REST de
-- Supabase (clave anon). El backend y Looker Studio se conectan con el
-- usuario "postgres" del pooler, que ignora RLS, asi que siguen funcionando.
ALTER TABLE "Users"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Warehouses"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WarehouseLocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Categories"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Products"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductStocks"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockMoves"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockMoveLines"     ENABLE ROW LEVEL SECURITY;