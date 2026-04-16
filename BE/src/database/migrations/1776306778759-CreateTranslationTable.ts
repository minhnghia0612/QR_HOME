import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTranslationTable1776306778759 implements MigrationInterface {
    name = 'CreateTranslationTable1776306778759'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "translations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entity_type" character varying(50) NOT NULL, "entity_id" uuid NOT NULL, "lang" character varying(10) NOT NULL, "key" character varying(100) NOT NULL, "value" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_aca248c72ae1fb2390f1bf4cd87" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_translation_unique" ON "translations" ("entity_type", "entity_id", "lang", "key") `);
        await queryRunner.query(`CREATE INDEX "idx_translation_lookup" ON "translations" ("entity_type", "entity_id", "lang") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_translation_lookup"`);
        await queryRunner.query(`DROP INDEX "public"."idx_translation_unique"`);
        await queryRunner.query(`DROP TABLE "translations"`);
    }

}
