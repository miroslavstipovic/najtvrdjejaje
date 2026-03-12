# 🥚 Najtvrđe Jaje - Setup Guide

Portal za natjecanje u najtvrđem jajetu sa rang listama, rezultatima i statistikom.

## 📋 Preduvjeti

- Node.js 18+ 
- Docker & Docker Compose
- pnpm (ili npm/yarn)

## 🚀 Brzo pokretanje

### 1. Kreiraj `.env` fajl

Kreiraj `.env` fajl u root direktoriju projekta sa sljedećim sadržajem:

```bash
# Database
DATABASE_URL="postgresql://jaje_user:tvrdo_jaje_2024@localhost:5433/najtvrdje_jaje?schema=public"

# JWT Secret
JWT_SECRET="najtvrdje-jaje-super-secret-key-2024"

# Next.js
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### 2. Pokreni Docker kontejnere

```bash
docker-compose up -d
```

Ovo će pokrenuti:
- PostgreSQL bazu na portu `5433`
- pgAdmin na portu `8081`

### 3. Instaliraj dependencies

```bash
pnpm install
```

### 4. Generiraj Prisma klijent

```bash
pnpm db:generate
```

### 5. Pokreni migracije

```bash
pnpm db:push
```

### 6. Seed-aj bazu sa početnim podacima

```bash
pnpm db:seed
```

Ovo će kreirati:
- Admin korisnika: `admin@najtvrdjejaje.com` / `admin123`
- 4 test natjecatelja
- 1 kompletno natjecanje sa rundama i mečevima
- Rang liste
- Site settings

### 7. Pokreni development server

```bash
pnpm dev
```

Aplikacija će biti dostupna na `http://localhost:3000`

## 🗄️ Pristup bazi podataka

### Preko pgAdmin

1. Otvori `http://localhost:8081`
2. Login: `admin@najtvrdjejaje.com` / `tvrdo_jaje_2024`
3. Dodaj novi server:
   - Name: `Najtvrđe Jaje Local`
   - Host: `postgres` (ili `localhost` ako ne radi)
   - Port: `5432` (interno) ili `5433` (eksterno)
   - Database: `najtvrdje_jaje`
   - Username: `jaje_user`
   - Password: `tvrdo_jaje_2024`

### Preko terminal-a

```bash
psql postgresql://jaje_user:tvrdo_jaje_2024@localhost:5433/najtvrdje_jaje
```

## 📚 Dostupni npm skripte

```bash
pnpm dev              # Pokreni development server
pnpm build            # Build za produkciju
pnpm start            # Pokreni production server
pnpm db:generate      # Generiši Prisma klijent
pnpm db:push          # Push schema promjene u bazu
pnpm db:seed          # Seed-aj bazu sa podacima
```

## 🔑 Admin pristup

- Email: `admin@najtvrdjejaje.com`
- Password: `admin123`
- URL: `http://localhost:3000/admin`

## 🛑 Zaustavljanje

```bash
# Zaustavi kontejnere
docker-compose down

# Zaustavi i obriši volumes (PAŽNJA: briše podatke!)
docker-compose down -v
```

## 📊 Database Schema

Portal koristi sljedeće modele:

- **Competitor** - Natjecatelji sa ELO rating sistemom
- **Competition** - Natjecanja/Turniri
- **Round** - Kola natjecanja (četvrtfinale, polufinale, finale)
- **Match** - Mečevi između natjecatelja
- **Ranking** - Rang liste (opće i po natjecanju)
- **Media** - Medijska biblioteka
- **Admin** - Admin korisnici
- **SiteSettings** - Postavke sajta
- **AdSettings** - Postavke oglasa

## 🆘 Troubleshooting

### Port 5433 već zauzet?

Promijeni port u `docker-compose.yml` i `.env` fajlu.

### Greška: "Cannot connect to database"

1. Provjeri da li je Docker pokrenut: `docker ps`
2. Provjeri logs: `docker-compose logs postgres`
3. Restartuj kontejnere: `docker-compose restart`

### Greška pri seed-anju

```bash
# Resetuj bazu i pokušaj ponovo
pnpm db:push --force-reset
pnpm db:seed
```
