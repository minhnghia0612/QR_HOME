import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServicePriceRangeAndSpecialTags1720000000001
  implements MigrationInterface
{
  name = 'AddServicePriceRangeAndSpecialTags1720000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "services" ADD "price_from" numeric(10,2)',
    );
    await queryRunner.query(
      'ALTER TABLE "services" ADD "price_to" numeric(10,2)',
    );
    await queryRunner.query(
      'ALTER TABLE "services" ADD "special_tags" text',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "services" DROP COLUMN "special_tags"');
    await queryRunner.query('ALTER TABLE "services" DROP COLUMN "price_to"');
    await queryRunner.query('ALTER TABLE "services" DROP COLUMN "price_from"');
  }
}
