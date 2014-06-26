#!/usr/bin/env bash

# load rvm ruby
source ~/.rvm/environments/default

cd /var/www/pwtopical/current
rails r -e production 'script/fetch_linktv'

exit 0