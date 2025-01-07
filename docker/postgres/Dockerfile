FROM postgres:16

# Custom PostgreSQL configuration can be added here
COPY postgresql.conf /etc/postgresql/postgresql.conf
COPY init-scripts /docker-entrypoint-initdb.d

CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"] 