class SphereController < ApplicationController
    

    def signin_token
        uri = URI(params[:rtn].to_s)
        if Context.find_by("channel_info.allowed_rdr_hosts" => uri.host)
            token = SecureRandom.urlsafe_base64(20)
            rtnstate = {"statename" => params[:statename],
                        "stateparams" => params[:stateparams]}.to_json
            token_value = [uri, rtnstate]
            $redis.rpush("sntoken:#{token}", token_value)
            $redis.expire("sntoken:#{token}", 30)
            render :json => {"token" => token} and return
        else
            render(:nothing => true, :status => 401) and return
        end
        
    end

    def signin 
        token = params[:token]
        signin_token_value = $redis.lrange("sntoken:#{token}", 0, -1)
        if signin_token_value.present?
            session[:return_uri], session[:rtnstate] = signin_token_value
        end
    end

    def signin_submit
        credential = params[:user][:cred].downcase.strip rescue nil
        if credential =~ RHandleRegex
            user_query = Entity.where(:handle => credential)
        elsif credential =~ REmailRegex
            user_query = Entity.where(:email => credential)
        end
        
        if user = valid_signin(params[:user][:password].to_s, user_query)
            return_uri = signin_user(user.id.to_s)
            if return_uri
                redirect_to(return_uri) and return  
            else
                redirect_to(root_url) and return
            end
        else
            flash[:msg] = "User or Password invalid."
            flash[:cred] = credential if credential
            redirect_to(signin_url) and return
        end                       
    end

    def signin_verify
        render :text => session[:rtnstate], :content_type => 'application/json'
    end

    private

    def valid_signin(passwd, user_query=nil)
        if user_query
            if user = user_query.first
                if !!user.authenticate(passwd)
                    if !user.suspended
                       return user
                    end
                end
            end
        end
    end

    def signin_user(user_id)
        return_uri = session[:return_uri]
        reset_session
        session[:user_id] = user_id
        return_uri
    end
    
end