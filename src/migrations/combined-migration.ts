import { MigrationInterface, QueryRunner } from "typeorm";

export class CombinedMigration1727512345678 implements MigrationInterface {
    name = 'CombinedMigration1727512345678'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
                    CREATE TYPE "public"."user_role" AS ENUM('student', 'teacher', 'admin');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'webshop_status') THEN
                    CREATE TYPE "public"."webshop_status" AS ENUM('active', 'inactive');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
                    CREATE TYPE "public"."product_status" AS ENUM('available', 'unavailable');
                END IF;
            END
            $$;
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user" (
                "user_id" SERIAL PRIMARY KEY,
                "username" VARCHAR(6) UNIQUE NOT NULL,
                "email" VARCHAR(255) UNIQUE NOT NULL,
                "password" VARCHAR(255) NOT NULL,
                "role" "public"."user_role" NOT NULL DEFAULT 'student',
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
            )
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN "user"."username" IS 'Neptune kód (pl. HMF6XL)'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "user"."email" IS 'Email cím - szerepkör meghatározásához'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "user"."password" IS 'Bcrypt hash-elt jelszó'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "user"."role" IS 'Felhasználói szerepkör - email domain alapján automatikusan beállítva'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "user"."created_at" IS 'Regisztráció időpontja'
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "webshop" (
                "webshop_id" SERIAL PRIMARY KEY,
                "teacher_id" INTEGER NOT NULL,
                "subject_name" VARCHAR(255) NOT NULL,
                "paying_instrument" VARCHAR(50) NOT NULL,
                "paying_instrument_icon" VARCHAR(255) NOT NULL,
                "header_color_code" CHAR(7) NOT NULL,
                "creation_date" DATE DEFAULT CURRENT_DATE NOT NULL,
                "status" "public"."webshop_status" DEFAULT 'active' NOT NULL,
                CONSTRAINT "fk_webshop_teacher" FOREIGN KEY ("teacher_id") REFERENCES "user" ("user_id") ON DELETE RESTRICT,
                CONSTRAINT "chk_webshop_color_code" CHECK (header_color_code ~ '^#[0-9A-Fa-f]{6}$')
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user_balance" (
                "balance_id" SERIAL PRIMARY KEY,
                "user_id" INTEGER NOT NULL,
                "webshop_id" INTEGER NOT NULL,
                "amount" DECIMAL(10, 2) NOT NULL DEFAULT 0,
                CONSTRAINT "fk_user_balance_user" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE CASCADE,
                CONSTRAINT "fk_user_balance_webshop" FOREIGN KEY ("webshop_id") REFERENCES "webshop" ("webshop_id") ON DELETE CASCADE,
                CONSTRAINT "uq_user_balance" UNIQUE ("user_id", "webshop_id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "product" (
                "product_id" SERIAL PRIMARY KEY,
                "webshop_id" INTEGER NOT NULL,
                "name" VARCHAR(255) NOT NULL,
                "category" VARCHAR(100) NOT NULL,
                "image" VARCHAR(255),
                "description" TEXT NOT NULL,
                "price" DECIMAL(10, 2) NOT NULL,
                "max_stock" INTEGER NOT NULL,
                "current_stock" INTEGER NOT NULL,
                "upload_date" DATE DEFAULT CURRENT_DATE NOT NULL,
                "status" "public"."product_status" DEFAULT 'available' NOT NULL,
                CONSTRAINT "fk_product_webshop" FOREIGN KEY ("webshop_id") REFERENCES "webshop" ("webshop_id") ON DELETE CASCADE,
                CONSTRAINT "chk_product_stock" CHECK (current_stock >= 0 AND current_stock <= max_stock)
            )
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "cart" (
                "cart_id" SERIAL PRIMARY KEY,
                "user_id" INTEGER NOT NULL,
                "webshop_id" INTEGER NOT NULL,
                CONSTRAINT "fk_cart_user" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE CASCADE,
                CONSTRAINT "fk_cart_webshop" FOREIGN KEY ("webshop_id") REFERENCES "webshop" ("webshop_id") ON DELETE CASCADE,
                CONSTRAINT "uq_cart" UNIQUE ("user_id", "webshop_id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "cart_item" (
                "cart_item_id" SERIAL PRIMARY KEY,
                "cart_id" INTEGER NOT NULL,
                "product_id" INTEGER NOT NULL,
                "quantity" INTEGER NOT NULL,
                CONSTRAINT "fk_cart_item_cart" FOREIGN KEY ("cart_id") REFERENCES "cart" ("cart_id") ON DELETE CASCADE,
                CONSTRAINT "fk_cart_item_product" FOREIGN KEY ("product_id") REFERENCES "product" ("product_id") ON DELETE CASCADE,
                CONSTRAINT "chk_cart_item_quantity" CHECK (quantity > 0)
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "purchase" (
                "purchase_id" SERIAL PRIMARY KEY,
                "user_id" INTEGER NOT NULL,
                "product_id" INTEGER NOT NULL,
                "quantity" INTEGER NOT NULL,
                "purchase_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                CONSTRAINT "fk_purchase_user" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE RESTRICT,
                CONSTRAINT "fk_purchase_product" FOREIGN KEY ("product_id") REFERENCES "product" ("product_id") ON DELETE RESTRICT,
                CONSTRAINT "chk_purchase_quantity" CHECK (quantity > 0)
            )
        `);

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_user_email" ON "user" ("email")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_user_username" ON "user" ("username")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_webshop_teacher" ON "webshop" ("teacher_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_product_webshop" ON "product" ("webshop_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_user_balance_user" ON "user_balance" ("user_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_user_balance_webshop" ON "user_balance" ("webshop_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_cart_user" ON "cart" ("user_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_cart_webshop" ON "cart" ("webshop_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_cart_item_cart" ON "cart_item" ("cart_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_cart_item_product" ON "cart_item" ("product_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_purchase_user" ON "purchase" ("user_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_purchase_product" ON "purchase" ("product_id")`);

        await queryRunner.query(`
            INSERT INTO "user" (username, email, password, role) VALUES
            ('admin', 'admin@admin.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
            ('diak', 'diak@student.uni-pannon.hu', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
            ('tanar', 'tanar@teacher.uni-pannon.hu', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher')
            ON CONFLICT (username) DO NOTHING
        `);

        const webshopExists = await queryRunner.query(`
            SELECT COUNT(*) FROM "webshop" WHERE webshop_id = 0
        `);

        if (webshopExists[0].count === '0') {
            await queryRunner.query(`
                ALTER SEQUENCE webshop_webshop_id_seq MINVALUE 0 START WITH 0;
                SELECT setval('webshop_webshop_id_seq', 0, false);
            `);

            const adminUser = await queryRunner.query(`
                SELECT user_id FROM "user" WHERE username = 'admin' LIMIT 1
            `);

            if (adminUser.length > 0) {
                await queryRunner.query(`
                    INSERT INTO webshop (webshop_id, teacher_id, subject_name, paying_instrument, paying_instrument_icon, header_color_code, status)
                    VALUES (0, ${adminUser[0].user_id}, 'Globális Webshop', 'PP', 'default_icon_url', '#000000', 'active')
                `);
            }
        }

        await queryRunner.query(`
            SELECT setval('webshop_webshop_id_seq', (SELECT COALESCE(MAX(webshop_id), 0) FROM "webshop"), true);
        `);

        await queryRunner.query(`
            INSERT INTO user_balance (user_id, webshop_id, amount)
            SELECT u.user_id, 0, 100.00
            FROM "user" u
            WHERE NOT EXISTS (
                SELECT 1 FROM user_balance 
                WHERE user_id = u.user_id AND webshop_id = 0
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.query(`DROP TABLE IF EXISTS "purchase" CASCADE`);
            await queryRunner.query(`DROP TABLE IF EXISTS "cart_item" CASCADE`);
            await queryRunner.query(`DROP TABLE IF EXISTS "cart" CASCADE`);
            await queryRunner.query(`DROP TABLE IF EXISTS "product" CASCADE`);
            await queryRunner.query(`DROP TABLE IF EXISTS "user_balance" CASCADE`);
            await queryRunner.query(`DROP TABLE IF EXISTS "webshop" CASCADE`);
            await queryRunner.query(`DROP TABLE IF EXISTS "user" CASCADE`);

            await queryRunner.query(`DROP TYPE IF EXISTS "public"."product_status" CASCADE`);
            await queryRunner.query(`DROP TYPE IF EXISTS "public"."webshop_status" CASCADE`);
            await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_role" CASCADE`);
        } catch (error) {
            console.error('Error during migration down process:', error);
            throw error;
        }
    }
}