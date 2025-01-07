-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE jwt_token AS (
    role text,
    user_id uuid
);

-- Your schema creation SQL from before goes here
-- (including the RLS policies) 