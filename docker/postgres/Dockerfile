FROM postgres:16

# Install PostgreSQL Python extension and pip
RUN apt-get update \
    && apt-get install -y postgresql-plpython3-16 python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install required Python packages
RUN pip3 install langchain-openai langchain-community pinecone-client python-dotenv langchain-pinecone --break-system-packages

# Custom PostgreSQL configuration can be added here
COPY postgresql.conf /etc/postgresql/postgresql.conf
COPY init-scripts /docker-entrypoint-initdb.d

CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"] 