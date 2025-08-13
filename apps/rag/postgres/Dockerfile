FROM postgres:14

# Install AGE extension
RUN apt-get update && apt-get install -y \
    postgresql-14-age \
 && rm -rf /var/lib/apt/lists/*

# Install pgvector
RUN apt-get update && apt-get install -y \
    postgresql-14-pgvector \
 && rm -rf /var/lib/apt/lists/*

COPY ./initdb /docker-entrypoint-initdb.d

