# Math Cube v10 — Player ID + 5 Save Slots

## What changed

Math Cube v10 changes persistent game identity from a browser-specific anonymous Supabase user to a **Player ID + Save Slot** system.

- One Player ID can be continued in Duck, Chrome, Safari, mobile browsers, etc.
- Each Player has up to **5 save slots**.
- Player ID is a guest recovery key; registration is not required before playing.
- Local storage remains an immediate cache/offline fallback.
- Supabase is the persistent source of truth when configured.
- Game questions remain local; the game does not call the server for every answer.
- Slot saves use a monotonic revision so an older browser state cannot overwrite a newer cloud revision.

## First-time migration

If v9/v8 local data is already present in a browser, v10 automatically creates a local Player ID and places the existing data into Slot 1. The player can then continue and the slot can be uploaded to Supabase.

Creating **New Player** starts an empty player; it does not copy the current browser's game progress.

## Supabase setup

1. Keep the existing `supabase/schema.sql` for the base project, or run it on a fresh project.
2. The v10 SQL is also available separately as `supabase/schema_v10.sql`.
3. Run the v10 migration in Supabase SQL Editor.
4. Copy `js/config.example.js` to `js/config.js` and enter the Supabase project URL and publishable/anon key.

The v10 Player ID RPCs do not require anonymous Auth. The older Phase 2 Auth functions remain in the project for compatibility, but v10 records no longer depend on their browser-specific UUID.

## Cross-browser test

1. Open v10 in the original browser that contains the old records.
2. Continue the automatically migrated Player.
3. Copy the displayed Player ID, for example `MC-7F3A92`.
4. Play a Speed or Brain run and finish it.
5. Open Chrome/Safari.
6. Enter the same Player ID.
7. Select the same Save Slot.
8. The records should load from the cloud snapshot.

## Important identity note

A Player ID is currently a guest recovery key, not a password or full authentication credential. Anyone who knows the ID can request its cloud save. A later account-linking phase should add real authentication without changing the Player/Slot data model.
