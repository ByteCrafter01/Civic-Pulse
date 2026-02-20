-- Create role `civic` (if not exists) and the `civicpulse` database
-- Run this as a superuser (e.g. psql -U postgres -f init_db.sql)

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'civic') THEN
    CREATE ROLE civic WITH LOGIN PASSWORD 'civicpulse123';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'civicpulse') THEN
    EXECUTE 'CREATE DATABASE civicpulse OWNER civic';
  END IF;
END
$$;

-- Optional: grant privileges if needed
-- GRANT ALL PRIVILEGES ON DATABASE civicpulse TO civic;
