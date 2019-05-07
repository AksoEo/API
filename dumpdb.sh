#!/usr/bin/env bash

echo 'Truncating all tables without important data'
command="
SELECT concat('TRUNCATE TABLE ', TABLE_NAME, ';')
FROM INFORMATION_SCHEMA.TABLES
WHERE
	TABLE_NAME LIKE 'codeholders_hist_%'
	or TABLE_NAME = \"httpLog\";
"
mysql -u "$AKSO_MYSQL_USER" --password="$AKSO_MYSQL_PASSWORD" --database=akso --execute "$command" | sed 1d | mysql -u "$AKSO_MYSQL_USER" --password="$AKSO_MYSQL_PASSWORD" --database=akso

echo 'Dumping db'
mysqldump -u "$AKSO_MYSQL_USER" --password="$AKSO_MYSQL_PASSWORD" --add-drop-database --events --databases akso > db.sql
