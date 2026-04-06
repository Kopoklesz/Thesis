# PannonShop 🎓

**Magyar** | [English below](#english)

---

## 🇭🇺 Magyar

### Mi ez a projekt?

A **PannonShop** egy gamifikált webshop-rendszer, amelyet a Pannon Egyetem Programtervező Informatikusi szakán készítettem szakdolgozatként. A platform célja, hogy az oktatók virtuális boltokat hozhassanak létre tárgyaikhoz, ahol a hallgatók bónuszpontokat gyűjthetnek és válthatnak be különböző jutalmakra.

### Projekt célja

- A hallgatók jelenlét, plusz teljesítmény és egyéb aktivitások alapján pontokat gyűjthetnek.
- A pontokat felhasználhatják fizikai termékekre (pl. egyetemi merch), vagy a tanulmányaikat segítő előnyökre (pl. zh-bónusz százalék).
- Az oktatók saját webshopot hozhatnak létre, kezelhetik a termékeket és kioszthatják a pontokat.

---

### ⚙️ Technológiai stack

| Réteg | Technológia |
|---|---|
| **Backend** | NestJS (Node.js), TypeScript |
| **Adatbázis** | PostgreSQL + TypeORM |
| **Frontend** | React (Create React App) |
| **Autentikáció** | JWT (JSON Web Token) + Passport.js |
| **PDF generálás** | PDFKit |
| **QR kód** | qrcode npm csomag |
| **Jelszókezelés** | bcrypt |
| **Többnyelvűség** | i18next (HU / EN) |

---

### 🗂️ Projektstruktúra

```
pannonshop/
├── src/                        # Backend forráskód (NestJS)
│   ├── auth/                   # Autentikáció (regisztráció, login, JWT)
│   ├── entity/                 # TypeORM entitások
│   ├── webshop/                # Webshop kezelés
│   ├── signature/              # Pontgenerálás és beváltás
│   ├── user/                   # Felhasználókezelés
│   ├── cart/                   # Kosár funkció
│   ├── dto/                    # Data Transfer Objects
│   ├── migrations/             # Adatbázis migrációk
│   └── main.ts                 # Belépési pont (3001-es port)
│
├── frontend/                   # Frontend forráskód (React)
│   └── src/
│       ├── components/         # React komponensek
│       ├── context/            # AuthContext
│       ├── services/           # API hívások (authService, apiClient)
│       ├── css/                # Stíluslapok
│       └── i18n.js             # Fordítások (HU/EN)
│
├── .env                        # Lokális környezeti változók (nincs verziókezelve)
└── .gitignore
```

---

### 👤 Szerepkörök

| Szerepkör | Email domain | Jogosultságok |
|---|---|---|
| **Vendég** | — | Böngészés (webshop lista megtekintése) |
| **Hallgató** | `@student.uni-pannon.hu` | Vásárlás, egyenleg kezelés, kód/QR beváltás |
| **Oktató** | `@teacher.uni-pannon.hu` | Saját webshop létrehozása és kezelése, pontok generálása |
| **Admin** | `admin@uni-pannon.hu` | Teljes hozzáférés mindenhez |

> A szerepkör automatikusan az email domain alapján kerül meghatározásra regisztrációkor.

---

### ✅ Megvalósított funkciók

#### Autentikáció
- Regisztráció Neptun-kóddal (felhasználónév) és egyetemi email-lel
- Bejelentkezés (felhasználónév vagy email alapján)
- JWT token alapú authentikáció
- Jelszó komplexitás ellenőrzés (min. 8 kar., nagy/kisbetű, szám, speciális karakter)
- Jelszóváltoztatás
- Szerepkör-alapú hozzáférés-vezérlés (RBAC) frontend és backend oldalon is

#### Webshop rendszer
- Webshopok böngészése listából (hallgatók és vendégek számára)
- Webshop létrehozása és szerkesztése oktatóként
- Webshop egyedi megjelenés: fejléc szín, fizetési eszköz neve és ikonja
- Webshop státusz kezelés (aktív / inaktív)
- Partner kezelés: más oktatók hozzáadása a webshop kezeléséhez
  - Tulajdonos: teljes hozzáférés
  - Partner: csak termékkezelés

#### Termékkezelés
- Termékek létrehozása, szerkesztése, törlése
- Kategória szűrés
- Termékkép kezelés
- Készletkezelés
- Termék státusz (elérhető / nem elérhető)

#### Kosár és vásárlás
- Kosárba helyezés webshop alapon
- Egyenleg ellenőrzés vásárláskor
- Készlet csökkentés vásárláskor

#### Pontrendszer (Signature)
Háromféle módszer az oktató által:

1. **Kódgenerálás (PDF)** — Egyedi, nyomtatható kódok PDF-ben, amelyeket a hallgatók manuálisan váltanak be.
2. **QR kód generálás** — QR kép (PNG) generálása, maximális beváltási számmal és lejárattal.
3. **Közvetlen egyenleg-hozzáadás** — Az oktató megadott hallgatóknak közvetlenül írja jóvá a pontokat.

Hallgató oldalon:
- Kód beváltása szövegesen
- QR kód beolvasása (telefonnal)
- Race condition védelem a párhuzamos beváltás ellen

#### Hallgató profil
- Egyenleg összesítő webshopok szerinti bontásban
- Kézi kód beváltás a profiloldalról
- Vásárlási előzmények megtekintése

#### QR kód deep link
- A generált QR kódok URL-t tartalmaznak (nem nyers tokent)
- Telefon natív kamerájával beolvasva automatikusan megnyitja az oldalt
- Bejelentkezés után automatikusan beváltja a pontokat és visszajelzést ad

#### Oktató webshop statisztika
- Hallgatói egyenlegek megtekintése webshop alapján (ki mennyit gyűjtött)
- Vásárlási lista webshop alapján (ki mit vásárolt)

#### Admin panel
- Felhasználók listázása, keresése és szűrése szerepkör szerint
- Demo mód be/ki kapcsolása felhasználónként
- Felhasználó törlése

#### Demo mód
- Felhasználónként kapcsolható is_demo flag az admin panelről
- Demo felhasználók minden oldalt és funkciót látnak, de adatot nem módosíthatnak
- Látható figyelmeztető sáv jelenik meg demo módban

#### Karbantartás
- Automatikus cleanup task: lejárt kódok és QR-ok deaktiválása

#### UI/UX
- Magyar és angol nyelv (i18next)
- Reszponzív elrendezés
- Webshop témaszín dinamikus alkalmazása
- Karakter számlálók és validációs visszajelzések

---

### 🚀 Lokális indítás

#### Előfeltételek
- Node.js (>= 18)
- PostgreSQL

#### Backend
```bash
# Függőségek telepítése
npm install

# .env fájl létrehozása (minta alapján)
cp .env.example .env

# Migrációk futtatása
npm run migration:run

# Fejlesztői szerver indítása
npm run start:dev
```

A backend a `http://localhost:3001` címen fut.

#### Frontend
```bash
cd frontend
npm install
npm start
```

A frontend a `http://localhost:3000` címen fut.

#### Környezeti változók (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=<adatbázis felhasználónév>
DB_PASSWORD=<adatbázis jelszó>
DB_NAME=<adatbázis neve>
JWT_SECRET=<erős, egyedi titkos kulcs>
PORT=3001
NODE_ENV=development
```

---

### 🔐 Biztonsági megjegyzések

- A jelszavak bcrypt-tel kerülnek hash-elésre (10 salt round).
- A JWT titkos kulcs `.env`-ből olvasódik be — éles környezetben erős, véletlenszerű kulcsot kell megadni.
- A CORS konfiguráció `main.ts`-ben definiált; éles deploy előtt frissíteni kell a valós domain(ek)re.


---

### 📋 Adatbázis entitások

| Entitás | Leírás |
|---|---|
| `User` | Felhasználók (hallgatók, oktatók, admin) |
| `Webshop` | Virtuális boltok |
| `WebshopPartner` | Webshop-partner kapcsolatok |
| `Product` | Termékek |
| `UserBalance` | Felhasználói egyenlegek webshop alapon |
| `Cart` | Kosarak |
| `CartItem` | Kosár tételek |
| `Purchase` | Vásárlási előzmények |
| `SignatureGenerationEvent` | Pontgenerálási esemény |
| `SignatureCode` | Generált szöveges kódok |
| `SignatureQR` | Generált QR kódok |
| `SignatureQRActivation` | QR beváltási naplók |

---

### 📄 Licenc

Copyright © 2026 Kuti Bence  
Pannon Egyetem – Szakdolgozat

Részletek: [LICENSE](./LICENSE)

---

---

## 🇬🇧 English <a name="english"></a>

### What is this project?

**PannonShop** is a gamified webshop system developed as a university thesis project at the University of Pannonia, Computer Science (Software Engineering) program. The platform allows lecturers to create virtual shops for their courses, where students can earn and spend bonus points.

### Project Goal

- Students earn points based on attendance, extra performance, or other activities.
- Points can be spent on physical goods (e.g. university merch) or academic perks (e.g. bonus % on a test).
- Lecturers can create and manage their own webshops and distribute points to students.

---

### ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | NestJS (Node.js), TypeScript |
| **Database** | PostgreSQL + TypeORM |
| **Frontend** | React (Create React App) |
| **Authentication** | JWT + Passport.js |
| **PDF generation** | PDFKit |
| **QR code** | qrcode npm package |
| **Password security** | bcrypt |
| **Multilingual** | i18next (HU / EN) |

---

### 👤 User Roles

| Role | Email domain | Permissions |
|---|---|---|
| **Guest** | — | Browse webshop list |
| **Student** | `@student.uni-pannon.hu` | Purchase, manage balance, redeem codes/QR |
| **Teacher** | `@teacher.uni-pannon.hu` | Create & manage webshops, generate points |
| **Admin** | `admin@uni-pannon.hu` | Full system access |

> Role is automatically assigned based on email domain at registration.

---

### ✅ Implemented Features

#### Authentication
- Registration with Neptune code (username) and university email
- Login by username or email
- JWT-based authentication
- Password complexity validation
- Password change
- Role-based access control (RBAC) on both frontend and backend

#### Webshop System
- Browse webshops (available to guests and students)
- Create and edit webshops (teachers)
- Custom appearance: header color, currency name and icon
- Webshop status management (active / inactive)
- Partner management: add other teachers to co-manage a webshop
  - Owner: full access
  - Partner: product management only

#### Product Management
- Create, edit, delete products
- Category filtering
- Product image management
- Inventory tracking
- Product availability status

#### Cart & Purchasing
- Webshop-scoped cart
- Balance check at checkout
- Inventory deduction on purchase

#### Points System (Signature)
Three distribution methods for teachers:

1. **Code generation (PDF)** — Unique, printable codes in a PDF file, manually redeemed by students.
2. **QR code generation** — PNG image with configurable max activations and expiry date.
3. **Direct balance addition** — Instantly credit balance to selected students.

Student side:
- Redeem text codes
- Scan QR codes (mobile)
- Race condition protection for concurrent redemptions

#### Student Profile
- Balance summary broken down by webshop
- Manual code redemption from the profile page
- Purchase history view

#### QR Code Deep Link
- Generated QR codes contain a URL (not a raw token)
- Scanning with the phone's native camera opens the app automatically
- After login, points are redeemed automatically with result feedback

#### Teacher Webshop Statistics
- View student balances per webshop (who collected how much)
- View purchase list per webshop (who bought what)

#### Admin Panel
- List, search, and filter users by role
- Toggle demo mode per user
- Delete users

#### Demo Mode
- Per-user is_demo flag controllable from the admin panel
- Demo users can see all pages and features but cannot modify any data
- A visible warning banner is shown in demo mode

#### Maintenance
- Automatic cleanup task: deactivates expired codes and QRs

#### UI/UX
- Hungarian and English language support (i18next)
- Responsive layout
- Dynamic webshop theme color application
- Character counters and validation feedback

---

### 🚀 Local Setup

#### Prerequisites
- Node.js (>= 18)
- PostgreSQL

#### Backend
```bash
npm install
cp .env.example .env   # fill in your local values
npm run migration:run
npm run start:dev
```

Backend runs at `http://localhost:3001`.

#### Frontend
```bash
cd frontend
npm install
npm start
```

Frontend runs at `http://localhost:3000`.

#### Environment Variables (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=<db username>
DB_PASSWORD=<db password>
DB_NAME=<db name>
JWT_SECRET=<strong random secret>
PORT=3001
NODE_ENV=development
```

---

### 🔐 Security Notes

- Passwords are hashed with bcrypt (10 salt rounds).
- JWT secret is loaded from `.env` — use a strong, random value in production.
- CORS is configured in `main.ts` — update allowed origins before deploying.


---

### 📄 License

Copyright © 2026 Bence Kuti  
University of Pannonia – Bachelor Thesis

See [LICENSE](./LICENSE) for details.
