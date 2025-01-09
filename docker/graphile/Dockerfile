FROM node:alpine
LABEL description="Instant high-performance GraphQL API for your PostgreSQL database https://github.com/graphile/postgraphile"

# Install PostGraphile and PostGraphile connection filter plugin
RUN npm install -g postgraphile
RUN npm install -g postgraphile-plugin-connection-filter

EXPOSE 5000

ENTRYPOINT postgraphile \
    -n 0.0.0.0 \
    -c $DATABASE_URL \
    -s public \
    --append-plugins postgraphile-plugin-connection-filter \
    --enhance-graphiql \
    --allow-explain \
    --watch \
    --dynamic-json \
    --no-setof-functions-contain-nulls \
    --legacy-relations omit \
    --show-error-stack \
    --cors \
    --cors-origin "electron://-"
    # --jwt-secret $JWT_SECRET \
    # --jwt-pg-type-identifier public.jwt_token \

# CMD ["tail", "-f", "/dev/null"]