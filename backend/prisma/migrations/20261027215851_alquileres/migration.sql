-- DropForeignKey
ALTER TABLE "reserva_equipamientos" DROP CONSTRAINT "reserva_equipamientos_reserva_id_fkey";

-- CreateTable
CREATE TABLE "alquileres" (
    "id" UUID NOT NULL,
    "reserva_id" UUID NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alquileres_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alquileres_reserva_id_key" ON "alquileres"("reserva_id");

-- Backfill: crea un alquiler por reserva con items de equipamiento
-- (Antes de la FK nueva, para no romper bases con datos).
INSERT INTO "alquileres" ("id", "reserva_id", "total", "updated_at")
SELECT gen_random_uuid(), "reserva_id", SUM("cantidad" * "precio_unitario"), CURRENT_TIMESTAMP
FROM "reserva_equipamientos"
GROUP BY "reserva_id";

-- AddForeignKey
ALTER TABLE "reserva_equipamientos" ADD CONSTRAINT "reserva_equipamientos_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "alquileres"("reserva_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alquileres" ADD CONSTRAINT "alquileres_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
