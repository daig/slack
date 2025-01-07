-- -- Create custom schema for auth helpers
-- CREATE SCHEMA IF NOT EXISTS auth;

-- -- Helper function to get current user ID
-- CREATE OR REPLACE FUNCTION auth.user_id() 
-- RETURNS UUID AS $$
--   SELECT NULLIF(current_setting('app.user_id', TRUE), '')::UUID;
-- $$ LANGUAGE SQL STABLE;

-- -- Helper function to check if user is authenticated
-- CREATE OR REPLACE FUNCTION auth.is_authenticated() 
-- RETURNS BOOLEAN AS $$
--   SELECT auth.user_id() IS NOT NULL;
-- $$ LANGUAGE SQL STABLE;


-- -- Enable row level security on all tables
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_logins ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE message_channels ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

-- -- Users can only see non-UUID fields
-- -- CREATE POLICY users_select ON users
-- --     FOR SELECT TO PUBLIC
-- --     USING (true)
-- --     WITH CHECK (false);

-- -- User logins policies - users can only see their own login data
-- CREATE POLICY user_logins_select ON user_logins
--     FOR SELECT TO PUBLIC
--     USING (user_id = auth.user_id());

-- -- Messages policies - users can post as themselves and edit their own messages
-- CREATE POLICY messages_insert ON messages
--     FOR INSERT TO PUBLIC
--     WITH CHECK (user_id = auth.user_id());

-- CREATE POLICY messages_update ON messages
--     FOR UPDATE TO PUBLIC
--     USING (user_id = auth.user_id());

-- -- Message channels policies - users can only see messages in channels they're subscribed to
-- CREATE POLICY message_channels_select ON message_channels
--     FOR SELECT TO PUBLIC
--     USING (
--         (channel_id, auth.user_id()) IN (
--             SELECT channel_id, user_id 
--             FROM channel_members
--         )
--     );

-- CREATE POLICY message_channels_insert ON message_channels
--     FOR INSERT TO PUBLIC
--     WITH CHECK (
--         (channel_id, auth.user_id()) IN (
--             SELECT channel_id, user_id 
--             FROM channel_members
--         )
--     );