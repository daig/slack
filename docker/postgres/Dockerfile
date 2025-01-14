FROM postgres:16

# Install PostgreSQL Python extension
RUN apt-get update \
    && apt-get install -y postgresql-plpython3-16 \
    && rm -rf /var/lib/apt/lists/*

# Custom PostgreSQL configuration can be added here
COPY postgresql.conf /etc/postgresql/postgresql.conf
COPY init-scripts /docker-entrypoint-initdb.d

CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"] 