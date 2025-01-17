-- Create temporary table for chat data
CREATE TEMPORARY TABLE chats (
    Timestamp TEXT,
    Channel TEXT,
    Username TEXT,
    Message TEXT
);
-- Copy data from CSV file
COPY chats FROM '/docker-entrypoint-initdb.d/chats.csv' WITH (FORMAT csv, HEADER true);

-- First, create temporary users if they don't exist
INSERT INTO users (display_name)
SELECT DISTINCT Username 
FROM chats
ON CONFLICT (display_name) DO NOTHING;

-- Create default logins for each user with email pattern and default password
INSERT INTO user_logins (user_id, email, password_hash)
SELECT 
    id,
    display_name || '@pm.me',
    crypt('pass', gen_salt('bf', 10)) -- Generate bcrypt hash of 'pass' with work factor 10
FROM users
ON CONFLICT (email) DO NOTHING;


-- Create channels if they don't exist
INSERT INTO channels (name, is_dm)
SELECT DISTINCT TRIM('#' FROM Channel), FALSE
FROM chats
WHERE TRIM('#' FROM Channel) IS NOT NULL
ON CONFLICT DO NOTHING;


insert into messages (content, user_id, updated_at)
select Message, users.id, TO_TIMESTAMP(chats.Timestamp, 'YYYY-MM-DD HH24:MI:SS')
from chats
join users on users.display_name = chats.Username;

insert into message_channels (message_id, channel_id, posted_at)
select messages.id, channels.id, TO_TIMESTAMP(chats.Timestamp, 'YYYY-MM-DD HH24:MI:SS')
from chats
join users on users.display_name = chats.Username
join channels on channels.name = TRIM('#' FROM chats.Channel)
join messages on messages.content = chats.Message 
    AND messages.user_id = users.id 
    AND messages.updated_at = TO_TIMESTAMP(chats.Timestamp, 'YYYY-MM-DD HH24:MI:SS');

-- Clean up temporary table
DROP TABLE chats;

-- Create channel members
INSERT INTO channel_members (channel_id, user_id)
SELECT DISTINCT mc.channel_id, m.user_id
FROM message_channels mc
JOIN messages m ON m.id = mc.message_id
ON CONFLICT (channel_id, user_id) DO NOTHING;



