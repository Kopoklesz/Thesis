import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique, TableIndex } from 'typeorm';

export class AddWebshopPartners1730000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {0
    await queryRunner.createTable(
      new Table({
        name: 'webshop_partner',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'webshop_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'partner_teacher_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'added_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'added_by',
            type: 'integer',
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'webshop_partner',
      new TableForeignKey({
        columnNames: ['webshop_id'],
        referencedTableName: 'webshop',
        referencedColumnNames: ['webshop_id'],
        onDelete: 'CASCADE',
        name: 'fk_webshop_partner_webshop',
      })
    );

    await queryRunner.createForeignKey(
      'webshop_partner',
      new TableForeignKey({
        columnNames: ['partner_teacher_id'],
        referencedTableName: 'user',
        referencedColumnNames: ['user_id'],
        onDelete: 'CASCADE',
        name: 'fk_webshop_partner_teacher',
      })
    );

    await queryRunner.createForeignKey(
      'webshop_partner',
      new TableForeignKey({
        columnNames: ['added_by'],
        referencedTableName: 'user',
        referencedColumnNames: ['user_id'],
        onDelete: 'SET NULL',
        name: 'fk_webshop_partner_added_by',
      })
    );

    await queryRunner.createUniqueConstraint(
      'webshop_partner',
      new TableUnique({
        columnNames: ['webshop_id', 'partner_teacher_id'],
        name: 'uq_webshop_partner',
      })
    );

    await queryRunner.createIndex(
      'webshop_partner',
      new TableIndex({
        columnNames: ['webshop_id'],
        name: 'idx_webshop_partner_webshop',
      })
    );

    await queryRunner.createIndex(
      'webshop_partner',
      new TableIndex({
        columnNames: ['partner_teacher_id'],
        name: 'idx_webshop_partner_teacher',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('webshop_partner', 'idx_webshop_partner_teacher');
    await queryRunner.dropIndex('webshop_partner', 'idx_webshop_partner_webshop');

    await queryRunner.dropUniqueConstraint('webshop_partner', 'uq_webshop_partner');

    await queryRunner.dropForeignKey('webshop_partner', 'fk_webshop_partner_added_by');
    await queryRunner.dropForeignKey('webshop_partner', 'fk_webshop_partner_teacher');
    await queryRunner.dropForeignKey('webshop_partner', 'fk_webshop_partner_webshop');

    await queryRunner.dropTable('webshop_partner');
  }
}