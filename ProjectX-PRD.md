# Project X – Product Requirements Document (PRD)

## 📌 Samenvatting

Project X is een B2B groothandelsplatform voor parfums waarbij klanten producten kunnen bekijken en bestellen tegen hun eigen marges. Het platform ondersteunt een goedkeuringsflow, geavanceerd voorraadbeheer, picklijsten, marges per klant en categorie, staffelkortingen en uitgebreide filters. Het project wordt gebouwd in Next.js 15 App Router, Prisma, TypeScript en draait op Vercel + Supabase.

---

## 📦 MVP Functionaliteiten

### 1. Authenticatie

* Inloggen via gebruikersnaam of e-mail
* Geen wachtwoord nodig (gebaseerd op unieke URL of magic login)
* Gebruikerstypen: `admin`, `buyer`
* Role-based redirects na login
* JWT-gebaseerde sessies met NextAuth
* Gebruikers worden handmatig aangemaakt door admin

### 2. Productbeheer (Admin)

* CRUD: toevoegen, bewerken, verwijderen van producten
* Bulkimport via CSV/Excel
* Validatie op unieke EAN en verplichte velden
* Velden per product:

  * Merk, Naam, Inhoud, EAN, Inkoopprijs, Winkelprijs, Voorraad
  * Max bestelbare aantallen
  * Sterren (populariteit)
  * Afbeeldingen: één hoofdafbeelding + optioneel meerdere aanvullende foto's (bijv. verpakking, details, branding)
  * Tags
  * **Categorie & Subcategorie**
  * **Productomschrijving (rich text)**

### 3. Klantenbeheer

* Aanmaken en beheren van klanten via adminpanel
* Per klant:

  * Algemene marge in %
  * Marges per categorie (override)
  * Specifieke prijzen per product (override)
  * Kortingen per merk
  * Staffelkortingen op hoeveelheid
  * Tijdelijke promoties
  * Verborgen categorieën

### 4. Prijsweergave

* Klanten zien alleen hun aangepaste prijzen (opslag bij inkoopprijs)
* Berekening van prijs gebeurt server-side
* Afronding naar nette bedragen (.00 of .95)

### 5. Productoverzicht & Filters

* Filters:

  * Merk
  * Inhoud
  * Beschikbaarheid
  * Sterren
  * **Categorie & Subcategorie**
* Zoeken op naam of EAN
* Togglebare kolommen:

  * Prijs, Winkelprijs, Sterren, Verpakking

### 6. Bestellen

* Klant plaatst bestelling via overzicht
* Order wordt eerst ter goedkeuring aangeboden
* Na goedkeuring wordt voorraad aangepast
* Admin kan order goedkeuren of weigeren
* Orderstatus zichtbaar per klant

### 7. Orderbeheer (Admin)

* Overzicht van alle bestellingen
* Goedkeuren / Weigeren met auditlog
* Voorraad wordt pas aangepast bij goedkeuring
* Minimale bestelwaarde (bijv. 20 soorten) per klant instelbaar
* Rollback bij foutieve goedkeuring

---

## 📈 Roadmap na MVP

### 8. Picklijstsysteem (Warehouse Management)

* Orders krijgen pickstatus

* Picklijst gegenereerd met barcode ondersteuning

* Pickflow met scan of checkbox per product

* Scan = automatisch afvinken

* Admin dashboard: “Openstaande picklijsten”

* Pickgeschiedenis

* Mobiele versie via PWA

* Meertaligheid (i18n)

* Uitbreiding naar kledingcategorieën

* Scanfunctie voor inventaris

* POS-integratie

* Klantenrollen en rechtenbeheer

* Shopify/Bol/Amazon integratie

---

## ⚙️ Technische Stack

* **Frontend**: Next.js 15 (App Router), TailwindCSS
* **Backend**: Next.js API routes, Prisma ORM
* **Database**: PostgreSQL (via Supabase)
* **Auth**: NextAuth (met credentials provider)
* **Deploy**: Vercel
* **CI/CD**: GitHub Actions
* **Tests**: Vitest (unit), Playwright (e2e)
* **Storage**: Supabase bucket (voor productafbeeldingen)
* **Email**: SendGrid (indien nodig)

---

## 🧩 Architectuur

* `projectx`

  * `app/`: Next.js routes
  * `components/`: UI en page-specifieke components
  * `lib/`: helpers, auth, prisma-client, pricing logic
  * `prisma/`: `schema.prisma`
  * `types/`: globale types
  * `utils/`: kleine hulpfuncties
  * `__tests__/`: tests
  * `e2e/`: e2e tests

---

## 🔐 Beveiliging & Logging

* RBAC op routes
* Audit trail: elke admin-actie wordt gelogd
* Session opslag via JWT (server only)
* Productprijzen worden nooit berekend in frontend

---

## 🧪 Testing

* Alle modules moeten getest worden
* Vitest voor logica
* Playwright voor login, bestelproces, filters

---

## 📤 Exportfunctionaliteit

* Exporteerbare bestelformulieren (PDF/Excel/CSV)
* Kolommen en filters blijven behouden in export

---

## 🧠 Belangrijke Designkeuzes

* Admin = enige die gebruikers kan aanmaken
* Geen wachtwoord, enkel gebruikersnaam + unieke URL
* Alles draait om marges en voorraadbeheer

---

## 🔜 UI

Je verzoek om de interface visueel te laten lijken op de geüploade afbeelding is genoteerd. Deze stijl zal als uitgangspunt dienen voor het frontend design (sidebar links, kaartoverzicht dashboard, badges voor status, etc.). Dit nemen we op in het UI-ontwerpplan zodra je mockups gaat bouwen of designregels definieert.
