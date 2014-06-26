ENV["RAILS_ENV"] = "test"
require File.expand_path("../../config/environment", __FILE__)
require "rails/test_help"
require "minitest/rails"

#require "minitest/autorun"


# Uncomment if you want Capybara in accceptance/integration tests
#require "minitest/rails/capybara"
#require 'capybara/poltergeist'
#Capybara.javascript_driver = :poltergeist
#Capybara.default_wait_time = 5

# Uncomment if you want awesome colorful output
# require "minitest/pride"
Turn.config.format = :outline

class ActiveSupport::TestCase
  # Setup all fixtures in test/fixtures/*.(yml|csv) for all tests in alphabetical order.
  #fixtures :all

  # Add more helper methods to be used by all tests here...
end

# Do you want all existing Rails tests to use MiniTest::Rails?
# Comment out the following and either:
# A) Change the require on the existing tests to `require "minitest_helper"`
# B) Require this file's code in test_helper.rb

# MiniTest::Rails.override_testunit!
