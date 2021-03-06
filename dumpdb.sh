#!/usr/bin/env bash

echo 'Dumping db'
mysqldump -u "$AKSO_MYSQL_USER" --password="$AKSO_MYSQL_PASSWORD" --add-drop-database --events --databases akso --no-data > db.sql
