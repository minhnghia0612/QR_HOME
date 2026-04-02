import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeFullNameNullable1712025756001 implements MigrationInterface {
  name = 'MakeFullNameNullable1712025756001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admins" ALTER COLUMN "full_name" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admins" ALTER COLUMN "full_name" SET NOT NULL`,
    );
  }
}
