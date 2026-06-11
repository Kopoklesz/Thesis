import { MigrationInterface, QueryRunner } from 'typeorm';

// Az időbélyegnek a CombinedMigration1727512345678 (user tábla létrehozása) utánra
// kell esnie, különben friss adatbázison az ALTER TABLE nem létező táblára futna.
// Az IF NOT EXISTS a korábbi, AddIsDemoFlag1700000000004 néven már lefuttatott
// adatbázisokon teszi újrafuttathatóvá.
export class AddIsDemoFlag1730000000002 implements MigrationInterface {
  name = 'AddIsDemoFlag1730000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "is_demo" BOOLEAN NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "is_demo"`);
  }
}
