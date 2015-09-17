require 'mina/bundler'
require 'mina/rails'
require 'mina/git'
require 'mina/rbenv'  # for rbenv support. (http://rbenv.org)
# require 'mina/rvm'    # for rvm support. (http://rvm.io)

# Basic settings:
#   domain       - The hostname to SSH to.
#   deploy_to    - Path to deploy into.
#   repository   - Git repo to clone from. (needed by mina/git)
#   branch       - Branch name to deploy. (needed by mina/git)

set :domain, 'alpha2.planetwork.net'
set :deploy_to, '/var/www/spherical'
set :repository, 'git@github.com:planetwork/spherical.git'
set :branch, 'master'
set :term_mode, :system  # otherwise won't ask for github ssh passphrase

# Manually create these paths in shared/ (eg: shared/config/database.yml) in your server.
# They will be linked in the 'deploy:link_shared_paths' step.
set :shared_paths, ['config/mongoid.yml',
                    'config/initializers/server_specific.rb',
                    'config/initializers/social_auth_keys.rb',
                    'public/uploads',
                    'log',
                    'tmp']

# Optional settings:
set :user, 'spherical'    # Username in the server to SSH to.
#   set :port, '30000'     # SSH port number.

# This task is the environment that is loaded for most commands, such as
# `mina deploy` or `mina rake`.
task :environment do
  # If you're using rbenv, use this to load the rbenv environment.
  # Be sure to commit your .rbenv-version to your repository.
  invoke :'rbenv:load'

  # For those using RVM, use this to load an RVM version@gemset.
  # invoke :'rvm:use[ruby-1.9.3-p392@default]'
end

# Put any custom mkdir's in here for when `mina setup` is ran.
# For Rails apps, we'll make some of the shared paths that are shared between
# all releases.
task :setup => :environment do
  queue! %[mkdir -p "#{deploy_to}"]
  queue! %[chmod g+rx,u+rwx "#{deploy_to}"]

  queue! %[mkdir -p "#{deploy_to}/shared/log"]
  queue! %[chmod g+rx,u+rwx "#{deploy_to}/shared/log"]

  queue! %[mkdir -p "#{deploy_to}/shared/tmp"]
  queue! %[chmod g+rx,u+rwx "#{deploy_to}/shared/tmp"]

  queue! %[mkdir -p "#{deploy_to}/shared/config"]
  queue! %[chmod g+rx,u+rwx "#{deploy_to}/shared/config"]

  queue! %[mkdir -p "#{deploy_to}/shared/public/uploads"]
  queue! %[chmod g+rx,u+rwx "#{deploy_to}/shared/public/uploads"]

  queue! %[mkdir -p "#{deploy_to}/shared/config/initializers"]
  queue! %[chmod g+rx,u+rwx "#{deploy_to}/shared/config/initializers"]

  queue! %[touch "#{deploy_to}/shared/config/mongoid.yml"]
  queue  %[echo "-----> Be sure to edit 'shared/config/mongoid.yml'."]

  queue! %[touch "#{deploy_to}/shared/config/initializers/social_auth_keys.rb"]
  queue  %[echo "-----> Be sure to edit 'shared/config/initializers/social_auth_keys.rb'."]

  queue! %[touch "#{deploy_to}/shared/config/initializers/server_specific.rb"]
  queue  %[echo "-----> Be sure to edit 'shared/config/initializers/server_specific.rb'."]
end

namespace :thin do
  task :restart do
    queue %{
      echo "-----> Restarting thin"
      #{echo_cmd %[bundle exec thin restart -C /etc/thin/spherical.yml]}
    }
  end
end

desc "Deploys the current version to the server."
task :deploy => :environment do
  deploy do
    # Put things that will set up an empty directory into a fully set-up
    # instance of your project.
    invoke :'git:clone'
    invoke :'deploy:link_shared_paths'
    invoke :'bundle:install'
    invoke :'rails:assets_precompile'

    to :launch do
      #bundle exec thin restart -C /etc/thin/spherical.yml
      invoke :'thin:restart'
    end
  end
end

# to force an asset reload even if no assets have changed:
# mina deploy force_assets=true

# For help in making your deploy script, see the Mina documentation:
#
#  - http://nadarei.co/mina
#  - http://nadarei.co/mina/tasks
#  - http://nadarei.co/mina/settings
#  - http://nadarei.co/mina/helpers
