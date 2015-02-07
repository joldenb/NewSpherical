#!/usr/bin/env bash

# load rbenv
export HOME=/home/victor
export PATH="$HOME/.rbenv/bin:$PATH"
eval "$(rbenv init -)"

cd /var/www/spherical/current
bundle exec rails r -e production 'script/sweep_item_elevations'

exit 0
