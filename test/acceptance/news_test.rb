require File.expand_path('../../test_helper', __FILE__)

class NewsTest < ActionDispatch::IntegrationTest
  describe "home page" do
    it "has logo with alt='Planetwork'" do
      visit root_path
      page.first('h1').find('img')['alt'].must_equal "Planetwork"
    end
  end
end
