import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddThemeIdToQrConfig1712025756000 implements MigrationInterface {
  name = 'AddThemeIdToQrConfig1712025756000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "qr_config" ADD "theme_id" character varying(50) NOT NULL DEFAULT 'classic'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "qr_config" DROP COLUMN "theme_id"`);
  }
}
