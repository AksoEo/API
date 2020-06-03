#!/usr/bin/env bash

echo 'Truncating all tables without important data and censoring sensitive data'
trunc_command="
SELECT concat('TRUNCATE TABLE ', TABLE_NAME, ';')
FROM INFORMATION_SCHEMA.TABLES
WHERE
	TABLE_NAME LIKE 'codeholders_hist_%'
	or TABLE_NAME in (
		\"httpLog\",
		\"codeholders_totp_remember\",
		\"codeholders_logins\",
		\"codeholders_files\",
		\"magazines_editions_files\"
	);
"
command="$trunc_command
DELETE FROM pay_intents;
DELETE FROM pay_methods;
"

mysql -u "$AKSO_MYSQL_USER" --password="$AKSO_MYSQL_PASSWORD" --database=akso --execute "$command" | sed 1d | mysql -u "$AKSO_MYSQL_USER" --password="$AKSO_MYSQL_PASSWORD" --database=akso

echo 'Dumping db'
mysqldump -u "$AKSO_MYSQL_USER" --password="$AKSO_MYSQL_PASSWORD" --add-drop-database --events --databases akso > db.sql
