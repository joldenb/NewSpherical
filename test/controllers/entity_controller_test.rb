require File.expand_path('../../test_helper', __FILE__)

class EntityControllerTest < ActionController::TestCase
    describe EntityController do
        before do
            Context.where(:identifier => "planetwork", :context_types => ["Institutional", "Channel"]).first_or_create
            Entity.destroy_all
            EntityContext.destroy_all
        end

        it "fails user signup without params[:nda_accept]" do
            post :user_signup
            response.status.must_equal 200
            j = ActiveSupport::JSON.decode(response.body)
            refute j['success'], j['notice']
            j['notice'].must_equal "You must accept NDA."
            session[:user_id].must_be_nil
        end

        it "fails user signup without params[:user]" do
            post :user_signup, :nda_accept => "1"
            response.status.must_equal 200
            j = ActiveSupport::JSON.decode(response.body)
            refute j['success'], j['notice']
            j['notice'].must_equal "No params."
            session[:user_id].must_be_nil
        end

        it "fails user signup without correct params[:user] hash" do
            post :user_signup, :nda_accept => "1", :user => {}
            response.status.must_equal 200
            j = ActiveSupport::JSON.decode(response.body)
            refute j['success'], j['notice']
            j['notice'].must_equal "Missing or incorrect params."
            session[:user_id].must_be_nil
        end

        it "successfully creates new user" do
            post :user_signup, :nda_accept => "1", :user => {   :email => "test@example.com", 
                                            :handle => "tester", 
                                            :password => "test", 
                                            :password_confirmation => "test"}
            response.status.must_equal 200
            j = ActiveSupport::JSON.decode(response.body)
            assert j['success'], j['notice']
            j['notice'].must_equal "You are signed up!"
            session[:user_id].must_equal Entity.first.id
        end

        it "fails to create new user with bad values" do
            post :user_signup, :nda_accept => "1", :user => {   :email => "test@example.com", 
                                            :handle => "tester", 
                                            :password => "test", 
                                            :password_confirmation => "what?"}
            response.status.must_equal 200
            j = ActiveSupport::JSON.decode(response.body)
            refute j['success'], j['notice']
            j['notice'].must_equal "Password doesn't match confirmation"
            session[:user_id].must_be_nil
        end

        it "correctly checks valid admin" do
            ctx_id = Context.where(:identifier => "planetwork").first.id.to_s
            post :user_signup, :nda_accept => "1", :user => {:email => "test@example.com", 
                                        :handle => "tester", 
                                        :password => "test", 
                                        :password_confirmation => "test"}
            crnt_user = Entity.find(session[:user_id])
            crnt_user.handle.must_equal "tester"
            @controller.send(:valid_admin, nil, nil).must_be :===, false
            @controller.send(:valid_admin, ctx_id, "admin").must_be :===, false
            crnt_user.roles << Role.new(role: "curator", context: ctx_id) 
            @controller.send(:valid_admin, ctx_id, "curator").must_be :===, true
            @controller.send(:valid_admin, ctx_id, "admin").must_be :===, false
            @controller.send(:valid_admin, ctx_id, ["admin", "poobah"]).must_be :===, false
            @controller.send(:valid_admin, ctx_id, ["admin", "curator"]).must_be :===, true
        end

        it "correctly finds whether valid admin in any context" do
            ctx_id = Context.where(:identifier => "planetwork").first.id.to_s
            post :user_signup, :nda_accept => "1", :user => {:email => "test@example.com", 
                                        :handle => "tester", 
                                        :password => "test", 
                                        :password_confirmation => "test"}
            crnt_user = Entity.find(session[:user_id])
            crnt_user.handle.must_equal "tester"
            @controller.send(:admin_in_any_ctx).must_be :===, false
            @controller.send(:admin_in_any_ctx, "admin").must_be :===, false
            @controller.send(:admin_in_any_ctx, ["admin"]).must_be :===, false
            crnt_user.roles << Role.new(role: "curator", context: ctx_id)
            @controller.send(:admin_in_any_ctx, "curator").must_be :===, true
            @controller.send(:admin_in_any_ctx, ["admin", "curator"]).must_be :===, true
            crnt_user.roles << Role.new(role: "admin", context: ctx_id)
            @controller.send(:admin_in_any_ctx).must_be :===, true
        end
    end
end
