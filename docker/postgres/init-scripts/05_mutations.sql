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

-- Create function for setting up RAG with Pinecone
CREATE OR REPLACE FUNCTION setup_rag_for_chats()
RETURNS void AS $$
# Allow importing external modules
import sys
sys.path.append('/usr/local/lib/python3.11/site-packages')

import os
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
import pinecone

# Load environment variables
load_dotenv()

# Initialize Pinecone
pc = pinecone.Pinecone()

index_name = "chat-messages"

# Create index if it doesnt exist
try:
    pc.create_index(
        name=index_name,
        dimension=1536,
        metric="cosine",
        spec=pinecone.ServerlessSpec(
            cloud="aws",
            region="us-east-1"
        )
    )
except Exception as e:
    plpy.notice(f"Index creation skipped: {str(e)}")

# Query messages and channels
query = """
    SELECT 
        mc.posted_at as timestamp,
        c.name as channel,
        u.display_name as username,
        m.content as message
    FROM messages m
    JOIN message_channels mc ON m.id = mc.message_id
    JOIN channels c ON mc.channel_id = c.id
    JOIN users u ON m.user_id = u.id
"""

# Execute query
result = plpy.execute(query)

# Create a document for each message
documents = []
for row in result:
    doc = f"Time: {row['timestamp']}\nChannel: {row['channel']}\nUser: {row['username']}\nMessage: {row['message']}"
    documents.append(doc)

if documents:
    # Create vector store
    embeddings = OpenAIEmbeddings()
    vectorstore = PineconeVectorStore.from_texts(
        texts=documents,
        embedding=embeddings,
        index_name=index_name
    )
    plpy.notice(f"Successfully indexed {len(documents)} messages")
else:
    plpy.notice("No messages found to index")

$$ LANGUAGE plpython3u SECURITY DEFINER;

-- Add comment for GraphQL documentation
COMMENT ON FUNCTION setup_rag_for_chats() IS 
'Sets up a RAG (Retrieval Augmented Generation) system by indexing all chat messages in Pinecone.';

-- Grant execute permission to allow Postgraphile access
GRANT EXECUTE ON FUNCTION setup_rag_for_chats() TO PUBLIC;


-- Create function for creating RAG chain
CREATE OR REPLACE FUNCTION create_rag_chain()
RETURNS void AS $$
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# get vectorstore from pinecone
vectorstore = Pinecone.from_existing_index(
    index_name="chat-messages",
    embedding=OpenAIEmbeddings()
)

retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 3}
)

template = """Answer the question based only on the following context:

{context}

Question: {question}
"""

prompt = ChatPromptTemplate.from_template(template)

model = ChatOpenAI(
    model_name="gpt-3.5-turbo",
    temperature=0
)

chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | model
    | StrOutputParser()
)

if 'chains' not in GD:
    GD['chains'] = {}
GD['chains']['chat_messages'] = chain
plpy.notice("RAG chain created and saved to shared dictionary")

$$ LANGUAGE plpython3u;

-- Add comment for GraphQL documentation
COMMENT ON FUNCTION create_rag_chain() IS 
'Creates and stores a RAG chain for querying chat messages using the previously created vectorstore.';

-- Grant execute permission to allow Postgraphile access
GRANT EXECUTE ON FUNCTION create_rag_chain() TO PUBLIC;


-- Create function for querying chat messages using RAG
CREATE OR REPLACE FUNCTION ask_message(question TEXT)
RETURNS TEXT
STABLE AS $$
# Allow importing external modules
import sys
sys.path.append('/usr/local/lib/python3.11/site-packages')

import os
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_pinecone import PineconeVectorStore
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# Load environment variables
load_dotenv()

try:
    index_name = "chat-messages"
    
    # Create vector store connection
    embeddings = OpenAIEmbeddings()
    vectorstore = PineconeVectorStore.from_existing_index(
        embedding=embeddings,
        index_name=index_name
    )
    
    # Set up retriever
    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 3}
    )
    
    # Create prompt template
    template = """Answer the question based only on the following context:
    
    {context}
    
    Question: {question}
    """
    
    prompt = ChatPromptTemplate.from_template(template)
    
    # Create model
    model = ChatOpenAI(
        model_name="gpt-3.5-turbo",
        temperature=0
    )
    
    # Create and execute chain
    chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | prompt
        | model
        | StrOutputParser()
    )
    
    return chain.invoke(question)

except Exception as e:
    plpy.error(f"Error querying messages: {str(e)}")
    return None

$$ LANGUAGE plpython3u SECURITY DEFINER;

-- Add comment for GraphQL documentation
COMMENT ON FUNCTION ask_message(TEXT) IS 
'Queries chat messages using RAG (Retrieval Augmented Generation) to answer questions about chat history.';

-- Grant execute permission to allow Postgraphile access
GRANT EXECUTE ON FUNCTION ask_message(TEXT) TO PUBLIC;

-- Create custom type for S3 presigned URL response
CREATE TYPE s3_presigned_url_response AS (
    presigned_url TEXT,
    file_key TEXT,
    bucket TEXT
);

-- Create function for generating S3 presigned URLs
CREATE OR REPLACE FUNCTION generate_s3_presigned_url(
    file_name TEXT,
    file_size INTEGER,
    content_type TEXT DEFAULT NULL
) RETURNS s3_presigned_url_response AS $$
# Allow importing external modules
import sys
sys.path.append('/usr/local/lib/python3.11/site-packages')
sys.path.append('/app')

from s3_utils import generate_presigned_url

try:
    result = generate_presigned_url(
        file_name=file_name,
        file_size=file_size,
        content_type=content_type
    )
    return (result['presignedUrl'], result['fileKey'], result['bucket'])
except Exception as e:
    plpy.error(f"Error generating presigned URL: {str(e)}")
    return None

$$ LANGUAGE plpython3u SECURITY DEFINER;

-- Add comment for GraphQL documentation
COMMENT ON FUNCTION generate_s3_presigned_url(TEXT, INTEGER, TEXT) IS 
'Generates a presigned URL for uploading files to S3.';

COMMENT ON TYPE s3_presigned_url_response IS 
'Response type containing the presigned URL and file information for S3 uploads.';

-- Grant execute permission to allow Postgraphile access
GRANT EXECUTE ON FUNCTION generate_s3_presigned_url(TEXT, INTEGER, TEXT) TO PUBLIC;

-- Create function for creating a message with file attachment
CREATE OR REPLACE FUNCTION create_message_with_file(
    content TEXT,
    user_id UUID,
    channel_id UUID,
    file_key TEXT,
    bucket TEXT,
    content_type TEXT
) RETURNS messages AS $$
DECLARE
    new_message messages;
    new_file_attachment file_attachments;
BEGIN
    -- Start transaction
    BEGIN
        -- Create the message
        INSERT INTO messages (content, user_id)
        VALUES (content, user_id)
        RETURNING * INTO new_message;

        -- Create the channel association
        INSERT INTO message_channels (message_id, channel_id)
        VALUES (new_message.id, channel_id);

        -- Create the file attachment
        INSERT INTO file_attachments (file_key, bucket, content_type)
        VALUES (file_key, bucket, content_type)
        RETURNING * INTO new_file_attachment;

        -- Create the message-file association
        INSERT INTO message_attachments (message_id, file_id)
        VALUES (new_message.id, new_file_attachment.id);

        -- Return the created message
        RETURN new_message;
    EXCEPTION WHEN OTHERS THEN
        -- If anything fails, rollback the transaction
        RAISE;
    END;
END;
$$ LANGUAGE plpgsql STRICT SECURITY DEFINER;

-- Add comment for GraphQL documentation
COMMENT ON FUNCTION create_message_with_file(TEXT, UUID, UUID, TEXT, TEXT, TEXT) IS 
'Creates a new message with an attached file and associates it with a channel.';

-- Create function for indexing a document in Pinecone
CREATE OR REPLACE FUNCTION index_document(
    file_key TEXT,
    bucket TEXT,
    content TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
) RETURNS void AS $$
# Allow importing external modules
import sys
sys.path.append('/usr/local/lib/python3.11/site-packages')

import os
from dotenv import load_dotenv
import pinecone
from langchain_openai import OpenAIEmbeddings
import json

# Load environment variables
load_dotenv()

try:
    # Initialize OpenAI embeddings
    embeddings = OpenAIEmbeddings()
    
    # Initialize Pinecone
    pc = pinecone.Pinecone()
    index_name = "documents"

    # Create index if it doesnt exist
    try:
        pc.create_index(
            name=index_name,
            dimension=1536,
            metric="cosine",
            spec=pinecone.ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
    except Exception as e:
        plpy.notice(f"Index exists or creation skipped: {str(e)}")

    # Get index
    index = pc.Index(index_name)

    # Parse metadata
    meta = json.loads(metadata) if isinstance(metadata, str) else dict(metadata)
    
    # Create clean metadata
    clean_metadata = {
        'file_key': file_key,
        'bucket': bucket,
        'file_name': meta.get('fileName', ''),
        'content_type': meta.get('contentType', ''),
        'uploaded_by': meta.get('uploadedBy', ''),
        'uploaded_at': meta.get('uploadedAt', ''),
        'file_size': meta.get('fileSize', 0)
    }

    # Generate embedding for the content
    vector = embeddings.embed_query(content)

    # Upsert to Pinecone with a unique ID
    index.upsert(
        vectors=[{
            'id': file_key,  # Use file_key as the unique identifier
            'values': vector,
            'metadata': clean_metadata
        }]
    )

    plpy.notice(f"Successfully indexed document: {file_key}")

except Exception as e:
    plpy.error(f"Error indexing document: {str(e)}")

$$ LANGUAGE plpython3u SECURITY DEFINER;

-- Add comment for GraphQL documentation
COMMENT ON FUNCTION index_document(TEXT, TEXT, TEXT, JSONB) IS 
'Indexes a document in Pinecone for later retrieval using semantic search.';

-- Grant execute permission to allow Postgraphile access
GRANT EXECUTE ON FUNCTION index_document(TEXT, TEXT, TEXT, JSONB) TO PUBLIC;

-- Create a composite type for search results
DROP TYPE IF EXISTS search_document_result CASCADE;
CREATE TYPE search_document_result AS (
    file_key TEXT,
    bucket TEXT,
    score FLOAT,
    metadata JSONB
);

-- Create function for searching documents
CREATE OR REPLACE FUNCTION search_documents(
    query TEXT,
    max_results INTEGER DEFAULT 3
) RETURNS SETOF search_document_result AS $$
# Allow importing external modules
import sys
sys.path.append('/usr/local/lib/python3.11/site-packages')

import os
from dotenv import load_dotenv
import pinecone
from langchain_openai import OpenAIEmbeddings
import json

# Load environment variables
load_dotenv()

try:
    # Initialize OpenAI embeddings
    embeddings = OpenAIEmbeddings()
    
    # Initialize Pinecone
    pc = pinecone.Pinecone()
    index = pc.Index("documents")

    # Generate query embedding
    query_embedding = embeddings.embed_query(query)

    # Search in Pinecone
    results = index.query(
        vector=query_embedding,
        top_k=max_results,
        include_metadata=True
    )

    # Format results for return
    return_results = []
    for match in results['matches']:
        metadata = match['metadata']
        # Create a clean metadata object with all required fields
        clean_metadata = {
            'file_key': metadata['file_key'],
            'bucket': metadata['bucket'],
            'fileName': metadata.get('file_name', ''),
            'contentType': metadata.get('content_type', ''),
            'uploadedBy': metadata.get('uploaded_by', ''),
            'uploadedAt': metadata.get('uploaded_at', ''),
            'fileSize': metadata.get('file_size', 0),
            'downloadUrl': f"https://{metadata['bucket']}.s3.amazonaws.com/{metadata['file_key']}"
        }
        
        return_results.append({
            "file_key": metadata['file_key'],
            "bucket": metadata['bucket'],
            "score": float(match['score']),
            "metadata": json.dumps(clean_metadata)
        })

    return return_results

except Exception as e:
    plpy.error(f"Error searching documents: {str(e)}")
    return []

$$ LANGUAGE plpython3u SECURITY DEFINER STABLE;

-- Add comment for GraphQL documentation
COMMENT ON FUNCTION search_documents(TEXT, INTEGER) IS 
'@name searchDocuments
@simpleCollections only
Searches for documents in Pinecone using semantic similarity.';

COMMENT ON TYPE search_document_result IS 
'Result type for document search queries containing file information and relevance score.';

-- Grant execute permission to allow Postgraphile access
GRANT EXECUTE ON FUNCTION search_documents(TEXT, INTEGER) TO PUBLIC;