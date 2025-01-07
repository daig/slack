    -- Insert some test users
    INSERT INTO users (id, display_name, avatar_url) VALUES
        ('11111111-1111-1111-1111-111111111111', 'alice', 'https://example.com/alice.jpg'),
        ('22222222-2222-2222-2222-222222222222', 'bob', 'https://example.com/bob.jpg'),
        ('33333333-3333-3333-3333-333333333333', 'carol', 'https://example.com/carol.jpg');

    -- Insert user logins
    INSERT INTO user_logins (user_id, email, password_hash) VALUES
        ('11111111-1111-1111-1111-111111111111', 'alice@example.com', crypt('password123', gen_salt('bf'))),
        ('22222222-2222-2222-2222-222222222222', 'bob@example.com', crypt('qwerty123', gen_salt('bf'))),
        ('33333333-3333-3333-3333-333333333333', 'carol@example.com', crypt('letmein123', gen_salt('bf')));

    -- Insert some channels
    INSERT INTO channels (id, name, description) VALUES
        ('44444444-4444-4444-4444-444444444444', 'general', 'General discussion channel'),
        ('55555555-5555-5555-5555-555555555555', 'random', 'Random conversations'),
        ('66666666-6666-6666-6666-666666666666', 'tech', 'Technical discussions');

    -- Insert some messages
    INSERT INTO messages (id, content, user_id, updated_at) VALUES
        ('77777777-7777-7777-7777-777777777777', 'Hello everyone!', '11111111-1111-1111-1111-111111111111', '2024-01-01 10:00:00+00'),
        ('88888888-8888-8888-8888-888888888888', 'Hi Alice!', '22222222-2222-2222-2222-222222222222', '2024-01-01 10:01:00+00'),
        ('99999999-9999-9999-9999-999999999999', 'Welcome to the channel!', '33333333-3333-3333-3333-333333333333', '2024-01-01 10:02:00+00');

    -- Link messages to channels
    INSERT INTO message_channels (message_id, channel_id) VALUES
        ('77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444'),
        ('88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444'),
        ('99999999-9999-9999-9999-999999999999', '44444444-4444-4444-4444-444444444444');

    -- Add users to channels
    INSERT INTO channel_members (channel_id, user_id) VALUES
        ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111'),
        ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222'),
        ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333'),
        ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111'),
        ('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222');