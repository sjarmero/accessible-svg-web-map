#!/bin/bash

curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
apt install -y nodejs

cd /opt/map
npm install
npm install -g typescript

make debug

service postgresql start
sudo -u postgres psql -f /opt/map/scripts/db.psql
sudo -u postgres psql -d gisdb -f db_backup/06032019.dbackup
service postgresql stop

cp /opt/map/scripts/map.conf /etc/nginx/sites-available/map.conf
ln -s /etc/nginx/sites-available/map.conf /etc/nginx/sites-enabled/map.conf
