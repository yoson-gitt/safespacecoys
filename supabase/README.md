# Supabase Setup

1. Run `schema.sql` to create tables.
2. Run `rls.sql` to enable RLS policies.
3. Deploy Edge Functions:
   - `functions/validate_post`
   - `functions/validate_mood`

Notes:
- The frontend will still work without functions; validation is best-effort.
- Cloud Sync must be enabled in Privacy settings for Supabase writes.
