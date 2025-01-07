
CREATE TABLE users ( -- Users table: Stores user account information
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique identifier for each user using UUID v4
    display_name VARCHAR(50) NOT NULL UNIQUE,
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
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    CONSTRAINT channel_name_valid CHECK (name ~ '^[a-z0-9_\-]+$') -- Ensures channel name only contains letters, numbers, hyphens, and underscores
);

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