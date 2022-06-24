#!/usr/bin/env bash

mysql -u "$AKSO_MYSQL_USER" --password="$AKSO_MYSQL_PASSWORD" < db.sql
