#!/usr/bin/env bash

mysqldump -p --add-drop-database --databases akso > db.sql
