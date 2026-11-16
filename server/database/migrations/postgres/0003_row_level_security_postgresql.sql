-- On Supabase, tables can be reached through its public API with the project's
-- anon key. Row level security with no policies refuses those roles everything,
-- while Kynova, connecting as the tables' owner, is not restricted by it.
-- Only tables this role owns are changed, so a database where an administrator
-- owns the tables and Kynova has a narrower role keeps working.

DO $$
DECLARE name text;
BEGIN
  FOR name IN
    SELECT tablename FROM pg_tables
     WHERE schemaname = current_schema() AND tableowner = current_user
       AND tablename IN ('users', 'sessions', 'workspaces', 'members', 'invites', 'docs', 'schema_migrations')
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', name);
  END LOOP;
END $$;
