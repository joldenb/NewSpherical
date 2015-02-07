#!/usr/bin/env bash

# load rbenv
export HOME=/home/victor
export PATH="$HOME/.rbenv/bin:$PATH"
eval "$(rbenv init -)"

cd /var/www/spherical/current
bundle exec rails r -e production 'script/fetch_linktv'

exit 0
