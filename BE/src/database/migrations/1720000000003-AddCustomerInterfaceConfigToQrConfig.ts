import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerInterfaceConfigToQrConfig1720000000003 implements MigrationInterface {
  name = 'AddCustomerInterfaceConfigToQrConfig1720000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TYPE \"public\".\"qr_config_currency_unit_enum\" AS ENUM('VND', 'USD', 'EUR')",
    );
    await queryRunner.query(
      "CREATE TYPE \"public\".\"qr_config_customer_ui_size_enum\" AS ENUM('large', 'normal', 'compact')",
    );

    await queryRunner.query(
      'ALTER TABLE "qr_config" ADD "currency_unit" "public"."qr_config_currency_unit_enum" NOT NULL DEFAULT \'VND\'',
    );
    await queryRunner.query(
      'ALTER TABLE "qr_config" ADD "primary_color" character varying(20) NOT NULL DEFAULT \'#0253CD\'',
    );
    await queryRunner.query(
      'ALTER TABLE "qr_config" ADD "secondary_color" character varying(20) NOT NULL DEFAULT \'#5E0B61\'',
    );
    await queryRunner.query(
      'ALTER TABLE "qr_config" ADD "font_family" character varying(100) NOT NULL DEFAULT \'Inter\'',
    );
    await queryRunner.query(
      'ALTER TABLE "qr_config" ADD "customer_ui_size" "public"."qr_config_customer_ui_size_enum" NOT NULL DEFAULT \'normal\'',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "qr_config" DROP COLUMN "customer_ui_size"',
    );
    await queryRunner.query(
      'ALTER TABLE "qr_config" DROP COLUMN "font_family"',
    );
    await queryRunner.query(
      'ALTER TABLE "qr_config" DROP COLUMN "secondary_color"',
    );
    await queryRunner.query(
      'ALTER TABLE "qr_config" DROP COLUMN "primary_color"',
    );
    await queryRunner.query(
      'ALTER TABLE "qr_config" DROP COLUMN "currency_unit"',
    );

    await queryRunner.query(
      'DROP TYPE "public"."qr_config_customer_ui_size_enum"',
    );
    await queryRunner.query(
      'DROP TYPE "public"."qr_config_currency_unit_enum"',
    );
  }
}
