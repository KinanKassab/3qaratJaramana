-- ============================================================
-- Vault-backed secret access for the telegram-webhook edge function
--
-- The edge function has no direct way to receive dashboard-managed
-- function secrets in this workflow, so the bot token and webhook
-- verification secret are stored encrypted in Supabase Vault instead
-- (via `vault.create_secret`, applied directly — never committed to
-- a migration file) and read back through this SECURITY DEFINER
-- wrapper, callable only by the service_role the edge function uses.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_telegram_secret(secret_name TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = secret_name LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_telegram_secret(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_telegram_secret(TEXT) TO service_role;
