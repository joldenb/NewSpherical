class EntityController < ApplicationController
    
    def user_signup
        signup_topics = []
        if session[:invitee_id]
            if invitee = Invitee.find(session[:invitee_id])
                if invitee.context && invitee.context.identifier
                    signup_topics << invitee.context.identifier
                else
                    render :json => {:success => false, :notice => "Missing invitee context."} and return
                end
            else
                render :json => {:success => false, :notice => "Can't find invitee."} and return
            end
        else
            signup_topics << "planetwork"
        end
        
        if params[:nda_accept] != "1"
            render :json => {:success => false, :notice => "You must accept NDA."} and return
        elsif !params[:user]
            render :json => {:success => false, :notice => "No params."} and return
        elsif !params[:user][:email].instance_of?(String) ||
                !params[:user][:handle].instance_of?(String) ||
                !params[:user][:password].instance_of?(String) ||
                !params[:user][:password_confirmation].instance_of?(String)
            render :json => {:success => false, :notice => "Missing or incorrect params."} and return
        end

        user_data = {
            :email => params[:user][:email].downcase.strip, 
            :handle => params[:user][:handle].downcase.strip, 
            :password => params[:user][:password],
            :password_confirmation => params[:user][:password_confirmation]}
        if invitee
            user_data[:role] = invitee.invited_role
            if invitee.invited_role == "demo"
                user_data[:suspended] = true
            end
        end
        begin
            new_user = EntityAgent.new(signup_topics, user_data).create_or_update_individual
        rescue Exception => e
            render :json => {:success => false, :notice => e.message} and return
        end
        if new_user.valid?
            if invitee
                invitee.update_attributes(:accepted => true, :accepted_user => new_user.id)
            end
            signin_user(new_user.id)
            render :json => {:success => true, :notice => "You are signed up!"}
        else
            render :json => {:success => false, :notice => "Signup failed."}
        end
    end

    def oauth_signup
        signup_topics = ["planetwork"]
        if !params[:user]
            render :json => {:success => false, :notice => "No params."} and return
        elsif !params[:user][:email].instance_of?(String) ||
                !params[:user][:handle].instance_of?(String)
            render :json => {:success => false, :notice => "Missing or incorrect params."} and return
        elsif session[:oauth].empty? || session[:oauth][:uid].empty? || session[:oauth][:provider].empty?
            render :json => {:success => false, :notice => "Missing oauth params."} and return
        end

        generated_password = SecureRandom.urlsafe_base64(20)
        user_data = {
            :email => params[:user][:email].downcase.strip, 
            :handle => params[:user][:handle].downcase.strip, 
            :password => generated_password,
            :password_confirmation => generated_password,
            :oauth_data => session[:oauth]}
        begin
            new_user = EntityAgent.new(signup_topics, user_data).create_individual_with_social_login
        rescue Exception => e
            render :json => {:success => false, :notice => e.message} and return
        end
        if new_user.valid?
            signin_user(new_user.id)
            render :json => {:success => true, :notice => "You are signed up!", :rdr => rdr}
        else
            render :json => {:success => false, :notice => "Signup failed."}
        end
    end

    def user_signin
        credential = params[:user][:cred].downcase.strip rescue nil
        if credential =~ RHandleRegex
            user_query = Entity.where(:handle => credential)
        elsif credential =~ REmailRegex
            user_query = Entity.where(:email => credential)
        end
        if user_query
            if user = user_query.first
                if !!user.authenticate(params[:user][:password].to_s)
                    if !user.suspended
                        signin_user(user.id.to_s)
                        if params[:remember_me] == "1"
                            update_remember_me_token(user)
                        end
                        render :json => {:success => true, 
                                        :notice => "You are signed in!",
                                        :rdr => @rdr}
                    else
                        render :json => {:success => false, :notice => "Signin unavailable."}
                    end
                else
                    render :json => {:success => false, :notice => "Signin incorrect."}
                end
            else
                render :json => {:success => false, :notice => "Signin incorrect."}
            end
        else
            render :json => {:success => false, :notice => "Signin incorrect."}
        end
    end

    def oauth_signin
        authinfo = request.env["omniauth.auth"]
        if authinfo && authinfo.provider && authinfo.provider == params[:provider] && callback_conf
            provider, uid, nym, name, image = authinfo.provider, authinfo.uid, authinfo.info.nickname, authinfo.info.name, authinfo.info.image
            if user = Entity.where("idps.uid" => uid).and("idps.provider" => authinfo.provider).first
                signin_user(user.id.to_s) unless user.suspended
            else
                session[:oauth_modal] = provider.to_s.titlecase
                session[:oauth] ||= {}
                session[:oauth][:provider] = provider.to_s
                session[:oauth][:uid] = uid.to_s
                session[:oauth][:nym] = nym.to_s
                session[:oauth][:name] = name.to_s
                session[:oauth][:image] = image.to_s
            end

           #render :text => %Q{Provider: #{provider}<br />UID: #{uid}<br />Nym: #{nym}<br />Name: #{name}<br />Image: #{image}}
        else
           session[:oauth] ||= {}
           session[:oauth][:error] = "Unknown authentication failure"
        end
        redirect_to(session[:doc_uri] ? session[:doc_uri] : root_url)
    end

    def oauth_add_to_account
        credential = params[:user][:cred].downcase.strip rescue nil
        if credential =~ RHandleRegex
            user_query = Entity.where(:handle => credential)
        elsif credential =~ REmailRegex
            user_query = Entity.where(:email => credential)
        end
        if user_query
            if user = user_query.first
                if !!user.authenticate(params[:user][:password].to_s) && session[:oauth].present?
                    provider_name = session[:oauth_modal]
                    session[:oauth].delete(provider_name.downcase)
                    begin
                        EntityAgent.add_idp_to_entity(user.handle, session[:oauth])
                    rescue => e
                        render :json => {:success => false, :notice => e.message} and return
                    end
                    signin_user(user.id.to_s)
                    render :json => {:success => true, :notice => "#{provider_name} added to your account!"}
                else
                    render :json => {:success => false, :notice => "Signin incorrect."}
                end
            else
                render :json => {:success => false, :notice => "Signin incorrect."}
            end
        else
            render :json => {:success => false, :notice => "Signin incorrect."}
        end
    end

    def new_group_accept
        if session[:invitee_id]
            if invitee = Invitee.find(session[:invitee_id])
                if existing_entity = Entity.where(:email => invitee.email).first
                    begin
                        EntityAgent.add_entity_to_ctx(existing_entity.id, invitee.context)
                        EntityAgent.add_role_in_context(existing_entity.id, invitee.context.id, invitee.invited_role)
                    rescue => e
                        render :json => {:success => false, :notice => e.message} and return
                    end
                    invitee.update_attributes(:accepted => true)
                    signin_user(existing_entity.id)
                    render :json => {:success => true, :notice => "You have joined #{invitee.context.display_identifier}!"} and return
                else
                    render :json => {:success => false, :notice => "No existing user found."} and return
                end
            else
                render :json => {:success => false, :notice => "No invitee found."} and return
            end
        else
            render :json => {:success => false, :notice => "No invitee id found."} and return
        end
    end

    def oauth_failure
        session[:oauth] ||= {}
        session[:oauth][:error] = params[:message]
        redirect_to root_url
    end

    def user_signout
        if cookies[:remember_me].present?
            cookies[:remember_me] = nil
            if current_user
                current_user.unset(:remember_me_token)
            end
        end
        reset_session
        render :json => {:success => true}
    end

    def reset_pwd
        if !session[:reset_key]
            session[:reset_key] = params[:reset_key]
            redirect_to root_url and return
        else
            reset_key = session[:reset_key]
            reset_session
            if reset_record = PwdRst.find_by(:reset_key => reset_key, :active => true)
                if @user = Entity.find(reset_record.entity_id)
                    if reset_record.created_at > 15.minutes.ago
                        session[:reset_allowed] = reset_record.id
                        @reset_allowed = true
                    else
                        @error = "The reset key has expired."
                    end
                else
                    @error = "The reset key is invalid."
                end
            else
                @error = "The reset key has already been used."
            end
            render :layout => false
        end
    end

    def reset_pwd_completion
        reset_allowed = session[:reset_allowed]
        if reset_allowed && params[:password].present? && params[:password_conf].present?
            if reset_record = PwdRst.find_by(:_id => reset_allowed, :active => true)
                if user = Entity.find(reset_record.entity_id)
                    if reset_record.created_at > 15.minutes.ago
                        msg = EntityAgent.update_password(user.id, params[:password], params[:password_conf])
                        if msg == "Updated password"
                            reset_record.update_attributes(:active => false)
                            signin_user(user.id) unless user.suspended
                            render :json => {"success" => true, "message" => msg} and return
                        else
                            render :json => {"success" => false, "message" => msg} and return
                        end
                    else
                        reset_session
                        render :json => {"success" => false, "message" => "Reset key has timed out."} and return
                    end
                else
                    reset_session
                    render :json => {"success" => false, "message" => "The reset key invalid."} and return
                end
            else
                reset_session
                render :json => {"success" => false, "message" => "Reset key not found."} and return
            end
        else
            reset_session
            render(:nothing => true, :status => 401) and return
        end
    end

    private
    def signin_user(user_id)
        rtn_params = session[:rtn_params]
        doc_uri = session[:doc_uri]
        authn_in_progress = session[:authn_in_progress]
        rdr = session[:redirect_uri]
        reset_session
        session[:user_id] = user_id
        session[:rtn_params] = rtn_params if rtn_params
        session[:doc_uri] = doc_uri if doc_uri
        session[:signedin] = true
        session[:authz_in_progress] = authn_in_progress if authn_in_progress
        @rdr = rdr ? rdr : false
    end

    def callback_conf
    if %w{twitter linkedin}.include?(params[:provider])
      session[:oauth][params[:provider]]['callback_confirmed']
    else
      ## facebook doesn't return this value, oh well
      true
    end
  end
end