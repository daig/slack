-- Create function for creating a message with channel association
CREATE OR REPLACE FUNCTION create_message_with_channel(
  content TEXT,
  user_id UUID,
  channel_id UUID
) RETURNS messages AS $$
DECLARE
  new_message messages;
BEGIN

  -- Insert the message
  INSERT INTO messages (content, user_id)
  VALUES (content, user_id)
  RETURNING * INTO new_message;

  -- Create the channel association
  INSERT INTO message_channels (message_id, channel_id)
  VALUES (new_message.id, channel_id);

  RETURN new_message;
END;
$$ LANGUAGE plpgsql STRICT;

-- Add comment for GraphQL documentation
COMMENT ON FUNCTION create_message_with_channel(TEXT, UUID, UUID) IS 
'Creates a new message and associates it with a channel.';

-- Add extension for password hashing if not already present
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function for creating a user with email and password
CREATE OR REPLACE FUNCTION create_user_with_login(
  display_name VARCHAR(50),
  email VARCHAR(255),
  password TEXT
) RETURNS users AS $$
DECLARE
  new_user users;
BEGIN
  -- Start transaction
  BEGIN
    -- Create the user first
    INSERT INTO users (display_name)
    VALUES (display_name)
    RETURNING * INTO new_user;

    -- Create the user login record with hashed password
    INSERT INTO user_logins (user_id, email, password_hash)
    VALUES (new_user.id, email, crypt(password, gen_salt('bf', 10)));

    -- Return the created user
    RETURN new_user;
  EXCEPTION WHEN OTHERS THEN
    -- If anything fails, rollback the transaction
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql STRICT SECURITY DEFINER;

-- Add comment for GraphQL documentation
COMMENT ON FUNCTION create_user_with_login(VARCHAR, VARCHAR, TEXT) IS 
'Creates a new user account with the given display name, email, and password.';


-- Function to verify user login credentials
CREATE OR REPLACE FUNCTION verify_user_login(user_email VARCHAR, user_password TEXT) 
RETURNS UUID AS $$
DECLARE
    found_user_id UUID;
BEGIN
    SELECT ul.user_id INTO found_user_id
    FROM user_logins ul
    WHERE ul.email = user_email 
    AND ul.password_hash = crypt(user_password, ul.password_hash);
    
    RETURN found_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add PL/Python extension
CREATE EXTENSION IF NOT EXISTS plpython3u;

-- Create a sample Python function that can be called from SQL
CREATE OR REPLACE FUNCTION public.py_hello(name TEXT)
RETURNS TEXT AS $$
    return f"Hello, {name} from Python!"
$$ LANGUAGE plpython3u STABLE;

-- Add comment for GraphQL documentation
COMMENT ON FUNCTION public.py_hello(TEXT) IS 
'A sample Python function that returns a greeting message.';

-- Grant execute permission to allow Postgraphile access
GRANT EXECUTE ON FUNCTION public.py_hello(TEXT) TO PUBLIC;