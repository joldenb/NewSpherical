# Be sure to restart your server when you modify this file.
#Topical::Application.config.session_store :cookie_store, key: '_topical_session'

Topical::Application.config.session_store :redis_store, :expires_in => 60.minutes
