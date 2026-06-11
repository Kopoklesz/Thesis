import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Referencia (publikus demo) adatok seedelése.
 *
 * Fiókok (mindegyik jelszava: PannonDemo1.):
 *  - admin  / admin@uni-pannon.hu            (admin)
 *  - TANAR1 / tanar1@teacher.uni-pannon.hu   (oktató)
 *  - TANAR2 / tanar2@teacher.uni-pannon.hu   (oktató)
 *  - DIAK01 / diak01@student.uni-pannon.hu   (hallgató)
 *  - DIAK02 / diak02@student.uni-pannon.hu   (hallgató)
 *
 * Ezen felül: 3 minta webshop termékekkel, hallgatói egyenlegekkel és
 * vásárlási előzményekkel, hogy a rendszer minden funkciója kipróbálható
 * legyen üres adatbázisból indulva is.
 *
 * Minden lépés idempotens (ON CONFLICT / NOT EXISTS), így a migráció olyan
 * adatbázison is lefut, ahol a korábbi seed (admin/diak/tanar) már létezik.
 */
export class SeedReferenceData1730000000003 implements MigrationInterface {
  name = 'SeedReferenceData1730000000003';

  // bcrypt hash a 'PannonDemo1.' jelszóhoz (10 salt round)
  private static readonly PASSWORD_HASH =
    '$2b$10$plf5azyefL.fdlfO6PpK3uM4B65ak5JcEH9wjBWY0wCxFZ18VdUSu';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hash = SeedReferenceData1730000000003.PASSWORD_HASH;

    // A korábbi seed admin@admin.com címet adott az admin fióknak, miközben a
    // szerepkör-logika admin@uni-pannon.hu-t vár. Javítjuk, ha még javítható.
    await queryRunner.query(`
      UPDATE "user" SET email = 'admin@uni-pannon.hu'
      WHERE username = 'admin'
        AND email = 'admin@admin.com'
        AND NOT EXISTS (SELECT 1 FROM "user" WHERE email = 'admin@uni-pannon.hu')
    `);

    await queryRunner.query(`
      INSERT INTO "user" (username, email, password, role) VALUES
        ('admin',  'admin@uni-pannon.hu',           '${hash}', 'admin'),
        ('TANAR1', 'tanar1@teacher.uni-pannon.hu',  '${hash}', 'teacher'),
        ('TANAR2', 'tanar2@teacher.uni-pannon.hu',  '${hash}', 'teacher'),
        ('DIAK01', 'diak01@student.uni-pannon.hu',  '${hash}', 'student'),
        ('DIAK02', 'diak02@student.uni-pannon.hu',  '${hash}', 'student')
      ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password
    `);

    // Rejtett globális webshop (webshop_id = 0) — a frontend kiszűri a
    // listából; a hozzá tartozó egyenleg a korábbi viselkedést őrzi meg.
    await queryRunner.query(`
      INSERT INTO webshop (webshop_id, teacher_id, subject_name, paying_instrument, paying_instrument_icon, header_color_code, status)
      SELECT 0, u.user_id, 'Globális Webshop', 'PP', '', '#000000', 'active'
      FROM "user" u
      WHERE u.username = 'admin'
      ON CONFLICT (webshop_id) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO webshop (teacher_id, subject_name, paying_instrument, paying_instrument_icon, header_color_code, status)
      SELECT u.user_id, w.subject_name, w.paying_instrument, '', w.color, 'active'
      FROM (VALUES
        ('TANAR1', 'Programozás alapjai',  'Bájt',   '#2E86AB'),
        ('TANAR1', 'Adatbázis-rendszerek', 'Kredit', '#6A4C93'),
        ('TANAR2', 'Webfejlesztés',        'Pixel',  '#1B998B')
      ) AS w(teacher_username, subject_name, paying_instrument, color)
      JOIN "user" u ON u.username = w.teacher_username
      WHERE NOT EXISTS (
        SELECT 1 FROM webshop WHERE subject_name = w.subject_name
      )
    `);

    // Az explicit webshop_id = 0 beszúrás után a sequence-t a tényleges
    // maximumra igazítjuk, hogy a következő létrehozott webshop ne ütközzön.
    await queryRunner.query(`
      SELECT setval('webshop_webshop_id_seq', GREATEST((SELECT COALESCE(MAX(webshop_id), 1) FROM webshop), 1), true)
    `);

    await queryRunner.query(`
      INSERT INTO product (webshop_id, name, category, image, description, price, max_stock, current_stock, status)
      SELECT ws.webshop_id, p.name, p.category, p.image, p.description, p.price, p.max_stock, p.current_stock, 'available'
      FROM (VALUES
        ('Programozás alapjai',  'ZH +5% bónusz',             'Tanulmányi bónusz', 'https://placehold.co/400x300/2E86AB/FFFFFF?text=ZH+Bonusz',     'A következő zárthelyi dolgozat eredményéhez 5% bónusz jár.',          450.00, 20, 20),
        ('Programozás alapjai',  'Beadandó határidő +2 nap',  'Tanulmányi bónusz', 'https://placehold.co/400x300/2E86AB/FFFFFF?text=%2B2+nap',      'A beadandó feladat határideje 2 nappal meghosszabbítható.',           300.00, 15, 15),
        ('Programozás alapjai',  'PannonShop póló',           'Merch',             'https://placehold.co/400x300/2E86AB/FFFFFF?text=Polo',          'Kényelmes egyetemi póló PannonShop logóval.',                         600.00, 30, 29),
        ('Programozás alapjai',  'Konzultációs alkalom',      'Szolgáltatás',      'https://placehold.co/400x300/2E86AB/FFFFFF?text=Konzultacio',   'Egyéni konzultációs lehetőség az oktatóval, előre egyeztetve.',       200.00, 10, 10),
        ('Adatbázis-rendszerek', 'Vizsga +3% bónusz',         'Tanulmányi bónusz', 'https://placehold.co/400x300/6A4C93/FFFFFF?text=Vizsga+Bonusz', 'A vizsga végeredményéhez 3% bónusz jár.',                             500.00, 20, 20),
        ('Adatbázis-rendszerek', 'PannonShop bögre',          'Merch',             'https://placehold.co/400x300/6A4C93/FFFFFF?text=Bogre',         'Kerámia bögre PannonShop felirattal.',                                350.00, 25, 24),
        ('Adatbázis-rendszerek', 'Plusz konzultáció',         'Szolgáltatás',      'https://placehold.co/400x300/6A4C93/FFFFFF?text=Konzultacio',   'Extra konzultációs alkalom a vizsgafelkészüléshez.',                  150.00, 12, 12),
        ('Webfejlesztés',        'KisZH újraírási lehetőség', 'Tanulmányi bónusz', 'https://placehold.co/400x300/1B998B/FFFFFF?text=KisZH',         'Egy tetszőleges kisZH egyszeri újraírását teszi lehetővé.',           400.00, 10, 10),
        ('Webfejlesztés',        'Kávé az oktatóval',         'Szolgáltatás',      'https://placehold.co/400x300/1B998B/FFFFFF?text=Kave',          'Kötetlen szakmai beszélgetés egy kávé mellett.',                      250.00,  8,  8),
        ('Webfejlesztés',        'Egyetemi jegyzetfüzet',     'Merch',             'https://placehold.co/400x300/1B998B/FFFFFF?text=Jegyzet',       'Pontozott lapos jegyzetfüzet egyetemi címerrel.',                     180.00, 40, 40)
      ) AS p(webshop_name, name, category, image, description, price, max_stock, current_stock)
      JOIN webshop ws ON ws.subject_name = p.webshop_name
      WHERE NOT EXISTS (
        SELECT 1 FROM product WHERE webshop_id = ws.webshop_id AND name = p.name
      )
    `);

    // Kezdő egyenlegek: a rejtett globális webshopban minden fióknak 100,
    // a minta webshopokban a hallgatóknak kipróbáláshoz elegendő összeg.
    await queryRunner.query(`
      INSERT INTO user_balance (user_id, webshop_id, amount)
      SELECT u.user_id, 0, 100.00
      FROM "user" u
      WHERE NOT EXISTS (
        SELECT 1 FROM user_balance WHERE user_id = u.user_id AND webshop_id = 0
      )
    `);

    await queryRunner.query(`
      INSERT INTO user_balance (user_id, webshop_id, amount)
      SELECT u.user_id, ws.webshop_id, b.amount
      FROM (VALUES
        ('DIAK01', 'Programozás alapjai',  750.00),
        ('DIAK01', 'Adatbázis-rendszerek', 320.00),
        ('DIAK01', 'Webfejlesztés',        150.00),
        ('DIAK02', 'Programozás alapjai',  280.00),
        ('DIAK02', 'Adatbázis-rendszerek', 600.00),
        ('DIAK02', 'Webfejlesztés',         90.00)
      ) AS b(username, webshop_name, amount)
      JOIN "user" u ON u.username = b.username
      JOIN webshop ws ON ws.subject_name = b.webshop_name
      WHERE NOT EXISTS (
        SELECT 1 FROM user_balance WHERE user_id = u.user_id AND webshop_id = ws.webshop_id
      )
    `);

    // Vásárlási előzmények, hogy a profil és a statisztika oldalak se
    // legyenek üresek. (A termékek készlete fent már ezzel csökkentve.)
    await queryRunner.query(`
      INSERT INTO purchase (user_id, product_id, quantity)
      SELECT u.user_id, p.product_id, 1
      FROM (VALUES
        ('DIAK01', 'PannonShop póló'),
        ('DIAK02', 'PannonShop bögre')
      ) AS pu(username, product_name)
      JOIN "user" u ON u.username = pu.username
      JOIN product p ON p.name = pu.product_name
      WHERE NOT EXISTS (
        SELECT 1 FROM purchase WHERE user_id = u.user_id AND product_id = p.product_id
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM purchase
      WHERE user_id IN (SELECT user_id FROM "user" WHERE username IN ('DIAK01', 'DIAK02'))
        AND product_id IN (SELECT product_id FROM product WHERE name IN ('PannonShop póló', 'PannonShop bögre'))
    `);

    // A minta webshopok törlése kaszkádolva viszi a termékeket,
    // egyenlegeket és kosarakat is.
    await queryRunner.query(`
      DELETE FROM webshop
      WHERE subject_name IN ('Programozás alapjai', 'Adatbázis-rendszerek', 'Webfejlesztés')
    `);

    await queryRunner.query(`
      DELETE FROM user_balance
      WHERE webshop_id = 0
        AND user_id IN (SELECT user_id FROM "user" WHERE username IN ('TANAR1', 'TANAR2', 'DIAK01', 'DIAK02'))
    `);

    await queryRunner.query(`
      DELETE FROM "user" WHERE username IN ('TANAR1', 'TANAR2', 'DIAK01', 'DIAK02')
    `);
    // Az 'admin' fiókot és a globális webshopot szándékosan nem töröljük:
    // korábbi telepítések adatai is függhetnek tőlük.
  }
}
