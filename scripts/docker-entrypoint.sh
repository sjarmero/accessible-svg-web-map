#!/bin/bash

cd /opt/map
service postgresql start
nohup node index.js &
service nginx start

tail -f /dev/null
