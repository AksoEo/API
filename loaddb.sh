#!/usr/bin/env bash

mysql -u root --password="$AKSO_MYSQL_PASSWORD" < db.sql
