CREATE TABLE users ( -- Users table: Stores user account information
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique identifier for each user using UUID v4
    display_name VARCHAR(50) NOT NULL UNIQUE,
    bio TEXT, -- User's biography or description
    avatar_url TEXT -- URL to user's profile picture
);

CREATE TABLE user_logins (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, -- Stores the encrypted password hash
    CONSTRAINT email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create an index for faster email lookups
CREATE INDEX idx_user_logins_email ON user_logins(email);

CREATE TABLE channels ( -- Channels table: Stores chat channels/rooms
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50),
    description TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    is_dm BOOLEAN DEFAULT FALSE,
    CONSTRAINT channel_name_valid CHECK (
        (is_dm IS TRUE AND name IS NULL) OR 
        (is_dm IS FALSE AND name ~ '^[a-z0-9_\-]+$')
    )
);

CREATE UNIQUE INDEX idx_channels_name ON channels (name) WHERE name IS NOT NULL;

CREATE FUNCTION get_dm_channel(user_id_1 UUID, user_id_2 UUID) RETURNS UUID AS $$
DECLARE
    channel_id UUID := uuid_combine(user_id_1, user_id_2);
    display_names TEXT;
BEGIN

    INSERT INTO channels (id, name, is_dm) 
    VALUES (channel_id, NULL, TRUE)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO channel_members (channel_id, user_id) 
    VALUES (channel_id, user_id_1), (channel_id, user_id_2)
    ON CONFLICT DO NOTHING;

    return channel_id;
END
$$ LANGUAGE plpgsql;


-- Modify messages table (remove the channel_id column)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE
);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_updated_at ON messages(updated_at);

-- Create message_channels junction table using channel name as foreign key
CREATE TABLE message_channels (
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (message_id, channel_id)
);
CREATE INDEX idx_message_channels_channel_name ON message_channels(channel_id);
CREATE INDEX idx_message_channels_message_id ON message_channels(message_id);



CREATE TABLE channel_members ( -- Channel members table: Maps users to channels they're subscribed to
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE, -- Reference to the channel
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Reference to the user
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Timestamp when user joined the channel
    PRIMARY KEY (channel_id, user_id) -- Composite primary key of channel and user IDs
);
CREATE INDEX idx_channel_members_user_id ON channel_members(user_id);

-- Function to automatically update timestamp when messages are modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP; -- Set the update timestamp to current time
    RETURN NEW; -- Return the modified record
END;
$$ language 'plpgsql';

CREATE TRIGGER update_messages_updated_at -- Trigger that calls the update function when a message is modified
    BEFORE UPDATE ON messages
    FOR EACH ROW
    WHEN (OLD.content IS DISTINCT FROM NEW.content)
    EXECUTE FUNCTION update_updated_at_column();

-- Add computed column for message edit status
CREATE OR REPLACE FUNCTION message_channels_is_edited(message_channels message_channels)
RETURNS BOOLEAN AS $$
    SELECT (
        SELECT updated_at 
        FROM messages 
        WHERE id = message_channels.message_id
    ) > message_channels.posted_at;
$$ LANGUAGE sql STABLE;

-- Add comment to help with GraphQL documentation
COMMENT ON FUNCTION message_channels_is_edited(message_channels) IS 
'Indicates whether the message has been edited since it was posted in this channel.';

-- File attachments table: Stores minimal information about uploaded files
CREATE TABLE file_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_key TEXT NOT NULL,  -- The S3 key used to retrieve the file
    bucket TEXT NOT NULL,    -- The S3 bucket name
    content_type TEXT        -- MIME type of the file
);

-- Junction table linking messages to their file attachments
CREATE TABLE message_attachments (
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    file_id UUID REFERENCES file_attachments(id) ON DELETE CASCADE,
    PRIMARY KEY (message_id, file_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX idx_message_attachments_file_id ON message_attachments(file_id);

-- Add comment to help with GraphQL documentation
COMMENT ON TABLE file_attachments IS 
'Stores information about files uploaded to S3.';

COMMENT ON TABLE message_attachments IS 
'Links messages to their file attachments.';