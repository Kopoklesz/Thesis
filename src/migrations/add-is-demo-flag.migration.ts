import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsDemoFlag1700000000004 implements MigrationInterface {
  name = 'AddIsDemoFlag1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "is_demo" BOOLEAN NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "is_demo"`);
  }
}
