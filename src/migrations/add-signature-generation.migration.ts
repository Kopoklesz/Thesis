import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddSignatureGeneration1730000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'generation_type') THEN
          CREATE TYPE "public"."generation_type" AS ENUM('code', 'qr', 'direct');
        END IF;
      END
      $$;
    `);

        await queryRunner.createTable(
            new Table({
                name: 'signature_generation_event',
                columns: [
                    {
                        name: 'event_id',
                        type: 'serial',
                        isPrimary: true,
                    },
                    {
                        name: 'webshop_id',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'teacher_id',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'generation_type',
                        type: 'enum',
                        enum: ['code', 'qr', 'direct'],
                        isNullable: false,
                    },
                    {
                        name: 'total_codes',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'code_value',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'expiry_date',
                        type: 'date',
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            'signature_generation_event',
            new TableForeignKey({
                columnNames: ['webshop_id'],
                referencedTableName: 'webshop',
                referencedColumnNames: ['webshop_id'],
                onDelete: 'CASCADE',
                name: 'fk_signature_event_webshop',
            })
        );

        await queryRunner.createForeignKey(
            'signature_generation_event',
            new TableForeignKey({
                columnNames: ['teacher_id'],
                referencedTableName: 'user',
                referencedColumnNames: ['user_id'],
                onDelete: 'CASCADE',
                name: 'fk_signature_event_teacher',
            })
        );

        await queryRunner.createIndex(
            'signature_generation_event',
            new TableIndex({
                name: 'idx_signature_event_expiry',
                columnNames: ['expiry_date'],
            })
        );

        await queryRunner.createTable(
            new Table({
                name: 'signature_code',
                columns: [
                    {
                        name: 'code_id',
                        type: 'serial',
                        isPrimary: true,
                    },
                    {
                        name: 'event_id',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'code',
                        type: 'varchar',
                        length: '8',
                        isNullable: false,
                        isUnique: true,
                    },
                    {
                        name: 'is_redeemed',
                        type: 'boolean',
                        default: false,
                        isNullable: false,
                    },
                    {
                        name: 'redeemed_by',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'redeemed_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            'signature_code',
            new TableForeignKey({
                columnNames: ['event_id'],
                referencedTableName: 'signature_generation_event',
                referencedColumnNames: ['event_id'],
                onDelete: 'CASCADE',
                name: 'fk_signature_code_event',
            })
        );

        await queryRunner.createForeignKey(
            'signature_code',
            new TableForeignKey({
                columnNames: ['redeemed_by'],
                referencedTableName: 'user',
                referencedColumnNames: ['user_id'],
                onDelete: 'SET NULL',
                name: 'fk_signature_code_redeemed_by',
            })
        );

        await queryRunner.createIndex(
            'signature_code',
            new TableIndex({
                name: 'idx_signature_code_unique',
                columnNames: ['code'],
                isUnique: true,
            })
        );

        await queryRunner.createTable(
            new Table({
                name: 'signature_qr',
                columns: [
                    {
                        name: 'qr_id',
                        type: 'serial',
                        isPrimary: true,
                    },
                    {
                        name: 'event_id',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'qr_data',
                        type: 'text',
                        isNullable: false,
                        isUnique: true,
                    },
                    {
                        name: 'max_activations',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'current_activations',
                        type: 'integer',
                        default: 0,
                        isNullable: false,
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                        isNullable: false,
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            'signature_qr',
            new TableForeignKey({
                columnNames: ['event_id'],
                referencedTableName: 'signature_generation_event',
                referencedColumnNames: ['event_id'],
                onDelete: 'CASCADE',
                name: 'fk_signature_qr_event',
            })
        );

        await queryRunner.createIndex(
            'signature_qr',
            new TableIndex({
                name: 'idx_signature_qr_data',
                columnNames: ['qr_data'],
                isUnique: true,
            })
        );

        await queryRunner.createTable(
            new Table({
                name: 'signature_qr_activation',
                columns: [
                    {
                        name: 'activation_id',
                        type: 'serial',
                        isPrimary: true,
                    },
                    {
                        name: 'qr_id',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'user_id',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'activated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            'signature_qr_activation',
            new TableForeignKey({
                columnNames: ['qr_id'],
                referencedTableName: 'signature_qr',
                referencedColumnNames: ['qr_id'],
                onDelete: 'CASCADE',
                name: 'fk_signature_qr_activation_qr',
            })
        );

        await queryRunner.createForeignKey(
            'signature_qr_activation',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedTableName: 'user',
                referencedColumnNames: ['user_id'],
                onDelete: 'CASCADE',
                name: 'fk_signature_qr_activation_user',
            })
        );

        await queryRunner.createIndex(
            'signature_qr_activation',
            new TableIndex({
                name: 'idx_signature_qr_activation_unique',
                columnNames: ['qr_id', 'user_id'],
                isUnique: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('signature_qr_activation', true);
        await queryRunner.dropTable('signature_qr', true);
        await queryRunner.dropTable('signature_code', true);
        await queryRunner.dropTable('signature_generation_event', true);

        await queryRunner.query(`DROP TYPE IF EXISTS "public"."generation_type"`);
    }
}