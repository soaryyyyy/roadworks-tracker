FROM postgres:14
COPY database/create.sql /docker-entrypoint-initdb.d/01-create.sql
COPY database/data.sql /docker-entrypoint-initdb.d/02-data.sql
