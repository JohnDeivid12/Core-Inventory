-- =====================================================================
-- CoreInventory - Capa de analitica para Looker Studio (Supabase)
-- Ejecutar DESPUES de schema.sql y seed.sql.
--
-- IMPORTANTE: antes de ejecutar, cambia CAMBIA_ESTA_CLAVE (linea del
-- CREATE ROLE) por una clave propia, solo letras y numeros, 12+ caracteres.
-- =====================================================================

-- Esquema aparte: NO queda expuesto por la API REST publica de Supabase
CREATE SCHEMA IF NOT EXISTS analytics;

-- ---------- Vista 1: detalle de movimientos (una fila por linea) ----------
CREATE OR REPLACE VIEW analytics.v_movimientos AS
SELECT
    l."id"                                                    AS linea_id,
    (m."scheduledDate" AT TIME ZONE 'America/Bogota')::date   AS fecha,
    to_char(m."scheduledDate" AT TIME ZONE 'America/Bogota', 'YYYY-MM') AS mes,
    m."reference"                                             AS referencia,
    CASE m."type"::text
        WHEN 'receipt'    THEN 'Recepción'
        WHEN 'delivery'   THEN 'Entrega'
        WHEN 'transfer'   THEN 'Transferencia'
        WHEN 'adjustment' THEN 'Ajuste'
    END                                                       AS tipo,
    CASE m."status"::text
        WHEN 'draft'     THEN 'Borrador'
        WHEN 'waiting'   THEN 'En espera'
        WHEN 'ready'     THEN 'Listo'
        WHEN 'done'      THEN 'Completado'
        WHEN 'cancelled' THEN 'Cancelado'
    END                                                       AS estado,
    NULLIF(m."partner", '')                                   AS tercero,
    fw."name"                                                 AS bodega_origen,
    tw."name"                                                 AS bodega_destino,
    COALESCE(l."productName", p."name")                       AS producto,
    COALESCE(l."sku", p."sku")                                AS sku,
    c."name"                                                  AS categoria,
    l."demandQty"                                             AS cantidad_solicitada,
    -- En los ajustes doneQty es el conteo final, no un movimiento: se excluye
    CASE WHEN m."type"::text = 'adjustment' THEN 0 ELSE COALESCE(l."doneQty", 0) END
                                                              AS cantidad_movida,
    CASE WHEN m."type"::text = 'adjustment' THEN 0
         ELSE (COALESCE(l."doneQty", 0) * COALESCE(p."costPrice", 0)) END::numeric(14,2)
                                                              AS valor_costo,
    CASE WHEN m."type"::text = 'delivery'
         THEN (COALESCE(l."doneQty", 0) * COALESCE(p."salePrice", 0)) ELSE 0 END::numeric(14,2)
                                                              AS valor_venta,
    u."name"                                                  AS creado_por
FROM "StockMoveLines" l
JOIN "StockMoves"  m ON m."id" = l."StockMoveId"
LEFT JOIN "Products"   p  ON p."id" = l."ProductId"
LEFT JOIN "Categories" c  ON c."id" = p."categoryId"
LEFT JOIN "Warehouses" fw ON fw."id" = m."fromWarehouseId"
LEFT JOIN "Warehouses" tw ON tw."id" = m."toWarehouseId"
LEFT JOIN "Users"      u  ON u."id" = m."createdById";

-- ---------- Vista 2: inventario actual (una fila por producto y bodega) ----------
CREATE OR REPLACE VIEW analytics.v_stock AS
SELECT
    s."id"                                   AS stock_id,
    p."name"                                 AS producto,
    p."sku"                                  AS sku,
    c."name"                                 AS categoria,
    w."name"                                 AS bodega,
    s."quantity"                             AS cantidad,
    p."minStockLevel"                        AS stock_minimo,
    (s."quantity" * p."costPrice")::numeric(14,2) AS valor_inventario,
    CASE
        WHEN s."quantity" <= 0                 THEN 'Agotado'
        WHEN s."quantity" < p."minStockLevel"  THEN 'Bajo'
        ELSE 'Normal'
    END                                      AS estado_stock
FROM "ProductStocks" s
JOIN "Products"   p ON p."id" = s."ProductId"
JOIN "Warehouses" w ON w."id" = s."WarehouseId"
LEFT JOIN "Categories" c ON c."id" = p."categoryId";

-- ---------- Usuario de solo lectura para Looker Studio ----------
CREATE ROLE looker_ro LOGIN PASSWORD 'Looker2026Inventario';
GRANT USAGE ON SCHEMA analytics TO looker_ro;
GRANT SELECT ON analytics.v_movimientos, analytics.v_stock TO looker_ro;
-- looker_ro no recibe ningun permiso sobre las tablas de "public"
-- (ni sobre "Users"): solo puede leer estas dos vistas.
