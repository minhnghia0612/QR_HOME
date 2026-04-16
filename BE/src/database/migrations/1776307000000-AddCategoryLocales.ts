import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryLocales1776307000000 implements MigrationInterface {
    name = 'AddCategoryLocales1776307000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "locales" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "locales"`);
    }
}
