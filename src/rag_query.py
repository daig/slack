import pandas as pd
from langchain_community.vectorstores import Pinecone
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from typing import List, Dict
import os
from dotenv import load_dotenv
import pinecone

load_dotenv()

chatspath = "../docker/postgres/init-scripts/chats.csv"

def setup_rag_for_chats(csv_path: str):
    """
    Set up the RAG system by loading chat messages and creating a vector store.
    """
    # Initialize Pinecone with new syntax
    pc = pinecone.Pinecone(
        api_key=os.getenv("PINECONE_API_KEY")
    )
    
    index_name = "chat-messages"
    
    # Create index if it doesn't exist (updated syntax)
    pc.create_index(
        name="chat-messages",
        dimension=1536,
        metric="cosine",
        spec=pinecone.ServerlessSpec(
            cloud="aws",
            region="us-east-1"
        )
    )

    
    # Read the CSV file
    df = pd.read_csv(csv_path)
    
    # Create a document for each message
    documents = []
    for _, row in df.iterrows():
        doc = f"Time: {row['Timestamp']}\nChannel: {row['Channel']}\nUser: {row['Username']}\nMessage: {row['Message']}"
        documents.append(doc)
    
    # Create vector store
    embeddings = OpenAIEmbeddings()
    vectorstore = Pinecone.from_texts(
        texts=documents,
        embedding=embeddings,
        index_name=index_name
    )
    
    return vectorstore

def create_rag_chain(vectorstore):
    """
    Create the RAG chain using the vector store.
    """
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
    
    return chain

def query_chat_messages(question: str, csv_path: str = "docker/postgres/init-scripts/chats.csv") -> str:
    """
    Query chat messages using RAG.
    
    Args:
        question: The question to ask about the chat messages
        csv_path: Path to the CSV file containing chat messages
    
    Returns:
        str: The answer to the question based on the chat messages
    """
    # Set up RAG system
    vectorstore = setup_rag_for_chats(csv_path)
    
    # Create and execute chain
    chain = create_rag_chain(vectorstore)
    response = chain.invoke(question)
    
    return response

# Example usage:
if __name__ == "__main__":
    # Example questions
    questions = [
        "What are the most common topics discussed in the dev-team channel?",
        "What kind of updates did Alice provide throughout the day?",
        "How many times was the code review mentioned?"
    ]
    
    for question in questions:
        print(f"\nQuestion: {question}")
        print(f"Answer: {query_chat_messages(question)}") 