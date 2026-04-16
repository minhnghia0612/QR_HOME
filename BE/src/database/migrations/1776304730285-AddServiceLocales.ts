import { MigrationInterface, QueryRunner } from "typeorm";

export class AddServiceLocales1776304730285 implements MigrationInterface {
    name = 'AddServiceLocales1776304730285'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add locales column safely (IF NOT EXISTS requires raw postgres checks or just let sync handle it, but we'll try catching if it already exists to be safe since sync might have done it)
        await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "locales" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "locales"`);
    }

}
