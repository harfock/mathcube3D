# Math Cube — Phase 2

Phase 2 is rebuilt from the Phase 1.3 Records base. The original Normal Mode 3D cube gameplay remains the foundation; later features are integrated as a clean progression layer rather than stacked patches.

## Included
- Original Normal Mode and level progression
- Responsive cyber green → blue → purple UI
- Speed Training
- Brain Training with progressive difficulty
- Five training hints
- Combo Station and combo flame progression
- S/A/B/C/D/E grading
- Personal records for Normal, Speed and Brain
- Golden Apple progression and cosmetic shop
- Collection and equipment state
- Achievements
- Daily / weekly challenge UI
- Five-language UI: English, Traditional Chinese, Simplified Chinese, Japanese, Korean
- One-language-at-a-time UI
- Smart horizontal scrolling for crowded action bars
- Supabase integration inherited from Phase 1.3 and extended schema
- Local fallback for progression when Supabase is not configured

## Important
Keep your own `js/config.js` with your Supabase URL and publishable key. It is intentionally not included when packaging a configured deployment.

## Supabase
Run `supabase/schema.sql` in the Supabase SQL editor. Anonymous Sign-ins must be enabled if using guest login.

## Hosting
Upload the project to GitHub Pages. The project uses Three.js 0.160.0 through the existing import map.
