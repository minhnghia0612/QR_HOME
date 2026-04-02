import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceVariants1720000000002 implements MigrationInterface {
  name = 'AddServiceVariants1720000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "services" ADD "has_variants" boolean NOT NULL DEFAULT false',
    );
    await queryRunner.query(
      'ALTER TABLE "services" ADD "variant_options" text',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "services" DROP COLUMN "variant_options"');
    await queryRunner.query('ALTER TABLE "services" DROP COLUMN "has_variants"');
  }
}
