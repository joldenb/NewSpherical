#!/usr/bin/env bash

# load rvm ruby
source ~/.rvm/environments/default

cd /var/www/pwtopical/current
rails r -e production 'script/fetch_r88r'

exit 0