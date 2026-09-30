# Math Cube — Supabase setup

Math Cube is designed to keep real-time gameplay in the browser while using Supabase for persistent player records.

## 1. Create a Supabase project

Create a project at Supabase and enable **Anonymous Sign-Ins** under Authentication.

## 2. Run the database schema

Open **SQL Editor** and run:

`supabase/schema.sql`

The schema creates player profiles, game sessions, separate Speed/Brain records, and a Golden Apple transaction ledger. Row Level Security is enabled, and the browser cannot directly insert sessions or modify the Apple wallet.

## 3. Configure the browser client

Open `js/config.js` and set:

```js
export const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'YOUR_PUBLISHABLE_KEY';
```

Use the project's **publishable key** (or legacy anon key where applicable). Never put a `service_role` key in a GitHub Pages site.

## 4. Test

If `js/config.js` is left blank, the game still runs using local storage and labels cloud status as Local. Once configured, the game silently creates an anonymous player and uploads completed Speed/Brain sessions.

## 5. Future account linking

The anonymous player can later be upgraded to a permanent account. This is intentionally not forced in the first cloud build.
