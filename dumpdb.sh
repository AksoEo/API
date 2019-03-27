#!/usr/bin/env bash

command="\
TRUNCATE httpLog; \
"

mysql -u "$AKSO_MYSQL_USER" --password="$AKSO_MYSQL_PASSWORD" --database=akso --execute "$command"
mysqldump -u "$AKSO_MYSQL_USER" --password="$AKSO_MYSQL_PASSWORD" --add-drop-database --databases akso > db.sql
