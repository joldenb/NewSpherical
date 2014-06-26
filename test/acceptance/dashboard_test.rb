require File.expand_path('../../test_helper', __FILE__)

class DashboardTest < ActionDispatch::IntegrationTest
  describe "dashboard" do
    before do
        Capybara.current_driver = Capybara.javascript_driver
    end

    it "has main menu container" do
        visit root_path
        dbrd = page.find('#dashboard')
        dhead = dbrd.find('#dashboard_header')
        dhead.first('h3', :text => "Planetwork Dashboard").must_be :present?
    end

    it "renders the main menu" do
        visit "http://127.0.0.1:3000/"
        main_menu = page.find('#main_menu')
        main_menu.must_be :present?

        channels = page.find('#channels')
        channels.must_be :present?
    end

  end
end