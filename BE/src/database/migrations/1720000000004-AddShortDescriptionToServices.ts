import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShortDescriptionToServices1720000000004
  implements MigrationInterface
{
  name = 'AddShortDescriptionToServices1720000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "services" ADD "short_description" character varying(300)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "services" DROP COLUMN "short_description"',
    );
  }
}
