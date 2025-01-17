-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE jwt_token AS (
    role text,
    user_id uuid
);

CREATE OR REPLACE FUNCTION uuid_combine(uuid1 uuid, uuid2 uuid) 
RETURNS uuid AS $$
BEGIN
    -- Convert UUIDs to their string representation and sort them
    -- Then concatenate and hash them to create a new deterministic UUID
    RETURN encode(
        digest(
            LEAST(uuid1::text, uuid2::text) || 
            GREATEST(uuid1::text, uuid2::text),
            'sha256'
        ),
        'hex'
    )::uuid;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Your schema creation SQL from before goes here
-- (including the RLS policies) 