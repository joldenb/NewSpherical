require File.expand_path('../../test_helper', __FILE__)

class InviteControllerTest < ActionController::TestCase
    describe InviteController do
        before do
            @planetwork = Context.where(:identifier => "planetwork", :context_types => ["Institutional", "Channel"]).first_or_create
            @climate = Context.where(:identifier => "climate", :context_types => ["Public Topic"]).first_or_create
            @climate.ctx_settings_list = CtxSettingsList.new(:can_invite => "curator") unless @climate.ctx_settings_list
            @planetwork.ctx_settings_list = CtxSettingsList.new(:can_invite => "admin") unless @planetwork.ctx_settings_list
            Entity.destroy_all
            EntityContext.destroy_all
            Invitee.destroy_all
            entity_data = {
                :email=>"person@example.com", 
                :screen_name=>"Test Entity", 
                :handle=>"aperson", 
                :password=>"mypassword"}
            @user = EntityAgent.new("climate", entity_data).create_or_update_individual
            ActionMailer::Base.deliveries = []
        end

        it "rejects invalid user access to invite form" do
            get :invitations_form, :group_id => @planetwork.id
            response.status.must_equal 401
        end

        it "accepts valid user access to invite form" do
            session[:user_id] = @user.id  #fake login

            get :invitations_form, :group_id => @climate.id
            response.status.must_equal 401

            @user.roles << Role.new(:role => "curator", :context => @climate.id)
            get :invitations_form, :group_id => @climate.id
            response.status.must_equal 200
        end

        it "allows validated user to send invitations" do
            session[:user_id] = @user.id  #fake login
            @user.roles << Role.new(:role => "curator", :context => @climate.id)
            get :invitations_form, :group_id => @climate.id
            response.status.must_equal 200

            invitation_addresses = %Q{test@example.com
            test2@example.com
            test3@example.com
            foo, bar}
            post :send_invitations, :context => @climate.id, 
                                    :invitation_addresses => invitation_addresses,
                                    :invitation_sig => "Just Us",
                                    :invitation_text => "You're Invited"

            response.status.must_equal 200
            j = ActiveSupport::JSON.decode(response.body)
            successes = j["successes"]
            invalid = j["invalid"]
            failed = j["failed"]
            successes.must_equal 3
            invalid.size.must_equal 2
            failed.must_be :empty?

            #fails on already invited
            invitation_addresses = %Q{test@example.com}
            post :send_invitations, :context => @climate.id,
                                    :invitation_addresses => invitation_addresses,
                                    :invitation_sig => "Just Us",
                                    :invitation_text => "You're Invited"
            response.status.must_equal 200
            j = ActiveSupport::JSON.decode(response.body)
            successes = j["successes"]
            invalid = j["invalid"]
            failed = j["failed"]["invited"]
            successes.must_equal 0
            invalid.size.must_equal 0
            failed.must_equal ["test@example.com"]

            #fails on already an active user
            entity_data = {
                :email=>"test4@example.com", 
                :screen_name=>"Test Entity", 
                :handle=>"testperson4", 
                :password=>"mypassword"}
            EntityAgent.new("climate", entity_data).create_or_update_individual
            invitation_addresses = %Q{test4@example.com}
            post :send_invitations, :context => @climate.id,
                                    :invitation_addresses => invitation_addresses,
                                    :invitation_sig => "Just Us",
                                    :invitation_text => "You're Invited"
            response.status.must_equal 200
            j = ActiveSupport::JSON.decode(response.body)
            successes = j["successes"]
            invalid = j["invalid"]
            failed = j["failed"]["active"]
            successes.must_equal 0
            invalid.size.must_equal 0
            failed.must_equal ["test4@example.com"]
        end

        
        it "allows an invitee to accept the invitation" do
            session[:user_id] = @user.id  #fake login
            @user.roles << Role.new(:role => "curator", :context => @climate.id)
            get :invitations_form, :group_id => @climate.id
            response.status.must_equal 200
            invitation_addresses = %Q{test@example.com}
            post :send_invitations, :context => @climate.id,
                                    :invitation_addresses => invitation_addresses,
                                    :invitation_sig => "Just Us",
                                    :invitation_text => "You're Invited"
            response.status.must_equal 200

            session[:invite_token] = Invitee.find_by(:email => "test@example.com").access_key
            get :accept
            response.status.must_equal 200
            assigns(:error_message).must_be_nil
            assigns(:message).must_equal %Q{You have been invited to join the #{@climate.display_identifier} Planetwork group.}
            assigns(:new_group_invite).must_be_nil
        end

        it "allows an invitee who is an existing user to accept the invitation" do
            entity_data = {
                :email=>"test@example.com", 
                :screen_name=>"Test Entity", 
                :handle=>"testperson", 
                :password=>"mypassword"}
            EntityAgent.new("planetwork", entity_data).create_or_update_individual

            session[:user_id] = @user.id  #fake login
            @user.roles << Role.new(:role => "curator", :context => @climate.id)
            get :invitations_form, :group_id => @climate.id
            response.status.must_equal 200
            invitation_addresses = %Q{test@example.com}
            post :send_invitations, :context => @climate.id,
                                    :invitation_addresses => invitation_addresses,
                                    :invitation_sig => "Just Us",
                                    :invitation_text => "You're Invited"
            response.status.must_equal 200

            session[:invite_token] = Invitee.find_by(:email => "test@example.com").access_key
            get :accept
            response.status.must_equal 200
            assigns(:error_message).must_be_nil
            assigns(:message).must_equal %Q{You have been invited to join the #{@climate.display_identifier} Planetwork group.}
            assigns(:new_group_invite).must_be :===, true
        end

        it "allows an invitee to opt-out" do
            session[:user_id] = @user.id  #fake login
            @user.roles << Role.new(:role => "curator", :context => @climate.id)
            get :invitations_form, :group_id => @climate.id
            response.status.must_equal 200
            invitation_addresses = %Q{test@example.com}
            post :send_invitations, :context => @climate.id,
                                    :invitation_addresses => invitation_addresses,
                                    :invitation_sig => "Just Us",
                                    :invitation_text => "You're Invited"
            response.status.must_equal 200
            session[:user_id] = nil #log out

            session[:opt_out_token] = Invitee.find_by(:email => "test@example.com").access_key
            get :opt_out
            response.status.must_equal 200
            assigns(:error_message).must_be_nil
            assigns(:message).must_equal %Q{Invitation Opt-Out}
            assigns(:ctx_name).must_equal @climate.display_identifier
            assigns(:accept_link).must_equal %Q{#{ENV['FULLHOST']}invite/accept/#{session[:opt_out_token]}}

            post :process_opt_out, :opt_out => "group"
            response.status.must_equal 200
            j = ActiveSupport::JSON.decode(response.body)
            j["success"].must_be :===, true
            j["notice"].must_equal "You are opted-out from the #{@climate.display_identifier} Planetwork group."

            get :opt_out
            response.status.must_equal 200
            assigns(:error_message).must_equal "You have already opted-out."

            #try inviting again
            session[:user_id] = @user.id  #fake login
            get :invitations_form, :group_id => @climate.id
            invitation_addresses = %Q{test@example.com}
            post :send_invitations, :context => @climate.id,
                                    :invitation_addresses => invitation_addresses,
                                    :invitation_sig => "Just Us",
                                    :invitation_text => "You're Invited"
            response.status.must_equal 200
            j = ActiveSupport::JSON.decode(response.body)
            successes = j["successes"]
            invalid = j["invalid"]
            failed = j["failed"]["optout"]
            successes.must_equal 0
            invalid.size.must_equal 0
            failed.must_equal ["test@example.com"]
        end

        it "allows an invitee to opt-out globally" do
            session[:user_id] = @user.id  #fake login
            @user.roles << Role.new(:role => "curator", :context => @climate.id)
            get :invitations_form, :group_id => @climate.id
            response.status.must_equal 200
            invitation_addresses = %Q{test@example.com}
            post :send_invitations, :context => @climate.id,
                                    :invitation_addresses => invitation_addresses,
                                    :invitation_sig => "Just Us",
                                    :invitation_text => "You're Invited"
            response.status.must_equal 200
            session[:user_id] = nil #log out

            session[:opt_out_token] = Invitee.find_by(:email => "test@example.com").access_key
            get :opt_out
            response.status.must_equal 200
            assigns(:error_message).must_be_nil
            assigns(:message).must_equal %Q{Invitation Opt-Out}
            assigns(:ctx_name).must_equal @climate.display_identifier
            assigns(:accept_link).must_equal %Q{#{ENV['FULLHOST']}invite/accept/#{session[:opt_out_token]}}

            post :process_opt_out, :opt_out => "global"
            response.status.must_equal 200
            j = ActiveSupport::JSON.decode(response.body)
            j["success"].must_be :===, true
            j["notice"].must_equal "You are opted-out from all Planetwork groups."

            get :opt_out
            response.status.must_equal 200
            assigns(:error_message).must_equal "You have already opted-out."

            #try inviting again
            session[:user_id] = @user.id  #fake login
            @user.roles << Role.new(:role => "admin", :context => @planetwork.id)
            get :invitations_form, :group_id => @planetwork.id
            invitation_addresses = %Q{test@example.com}
            post :send_invitations, :context => @planetwork.id, :invitation_addresses => invitation_addresses
            response.status.must_equal 200
            j = ActiveSupport::JSON.decode(response.body)
            successes = j["successes"]
            invalid = j["invalid"]
            failed = j["failed"]["global_optout"]
            successes.must_equal 0
            invalid.size.must_equal 0
            failed.must_equal ["test@example.com"]
        end
    end
end
