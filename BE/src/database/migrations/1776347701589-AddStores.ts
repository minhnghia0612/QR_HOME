import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStores1776347701589 implements MigrationInterface {
    name = 'AddStores1776347701589'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create stores table if not exists
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "stores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "admin_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7aa6e7d71fa7acdd7ca43d7c9cb" PRIMARY KEY ("id"))`);
        
        // Ensure columns exist and have correct types if table was created by an older version
        await queryRunner.query(`ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "stores" ALTER COLUMN "name" TYPE character varying(255)`);
        
        // Add constraint if not exists (using a DO block for Postgres)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_2f3f613d7812660f745f241218d') THEN
                    ALTER TABLE "stores" ADD CONSTRAINT "FK_2f3f613d7812660f745f241218d" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
                END IF;
            END $$;
        `);

        // 2. Add store_id to related tables if not exists
        const tables = ["categories", "services", "qr_config", "traffic_logs"];
        const constraints: Record<string, { col: string, ref: string }> = {
            "categories": { col: "store_id", ref: "FK_5848ba82e61b83e2aa416447a15" },
            "services": { col: "store_id", ref: "FK_9f3037c304b1544e37c339631d3" },
            "qr_config": { col: "store_id", ref: "FK_d5a83a66a3509d9c7421e9c554e" },
            "traffic_logs": { col: "store_id", ref: "FK_traffic_logs_store" }
        };

        for (const table of tables) {
            await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "store_id" uuid`);
            const config = constraints[table];
            await queryRunner.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${config.ref}') THEN
                        ALTER TABLE "${table}" ADD CONSTRAINT "${config.ref}" FOREIGN KEY ("${config.col}") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
                    END IF;
                END $$;
            `);
        }

        // 3. Data Migration: Create default store for existing admins and map their entities
        // Check if we've already done this (e.g. check if any record in stores exist?)
        // Or better: only update records where store_id is NULL
        const admins = await queryRunner.query(`SELECT id FROM "admins"`);
        for (const admin of admins) {
            // Check if admin already has a store
            const existingStores = await queryRunner.query(`SELECT id FROM "stores" WHERE "admin_id" = '${admin.id}' LIMIT 1`);
            let storeId;
            
            if (existingStores.length === 0) {
                const storeResult = await queryRunner.query(`INSERT INTO "stores" ("name", "admin_id") VALUES ('My Store', '${admin.id}') RETURNING "id"`);
                storeId = storeResult[0].id;
            } else {
                storeId = existingStores[0].id;
            }

            // Sync data only for records that don't have a store_id yet
            for (const table of tables) {
                await queryRunner.query(`UPDATE "${table}" SET "store_id" = '${storeId}' WHERE "admin_id" = '${admin.id}' AND "store_id" IS NULL`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "qr_config" DROP CONSTRAINT IF EXISTS "FK_d5a83a66a3509d9c7421e9c554e"`);
        await queryRunner.query(`ALTER TABLE "qr_config" DROP COLUMN IF EXISTS "store_id"`);

        await queryRunner.query(`ALTER TABLE "traffic_logs" DROP CONSTRAINT IF EXISTS "FK_traffic_logs_store"`);
        await queryRunner.query(`ALTER TABLE "traffic_logs" DROP COLUMN IF EXISTS "store_id"`);

        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "FK_9f3037c304b1544e37c339631d3"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "store_id"`);

        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "FK_5848ba82e61b83e2aa416447a15"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "store_id"`);

        await queryRunner.query(`ALTER TABLE "stores" DROP CONSTRAINT IF EXISTS "FK_2f3f613d7812660f745f241218d"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "stores"`);
    }
}
