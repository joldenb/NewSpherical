class SphereController < ApplicationController
    after_filter :add_cors_headers

    def index
      render :signin
    end

    def signup

    end

    def signin_token
        uri = URI(params[:rtn].to_s)
        if Context.find_by("channel_info.allowed_rdr_hosts" => uri.host)
            token = SecureRandom.urlsafe_base64(20)
            rtnstate = {"statename" => params[:statename],
                        "stateparams" => params[:stateparams]}.to_json
            $redis.rpush("sntoken:#{token}", %Q{#{uri.scheme}://#{uri.host}/#/signin/})
            $redis.rpush("sntoken:#{token}", rtnstate)
            $redis.expire("sntoken:#{token}", 60)
            render :json => {"token" => token} and return
        else
            render(:nothing => true, :status => 401) and return
        end

    end

    def signin
        token = params[:token]
        signin_token_value = $redis.lrange("sntoken:#{token}", 0, -1)
        rtn = params[:rtn].to_s if params[:rtn]
        if rtn =~ /\A\/[\w\/]+\z/
          session[:return_to] = rtn
        end
        if signin_token_value.present?
            session[:signin_return], session[:rtnstate] = signin_token_value
            $redis.del("sntoken:#{token}")
            #if user is already signed in to Spherical bounce them back
            if current_user && session[:signin_return] && session[:rtnstate]
                if session[:sess] && $redis.exists("sess:#{session[:sess]}")
                    $redis.expire("sess:#{session[:sess]}", 3600)
                    jwt = JWT.encode(session[:sess], ENV['JWT_HKEY'])
                    return_uri = make_signin_token(session[:sess], session[:signin_return], session[:rtnstate], jwt)
                    redirect_to(return_uri) and return
                else
                    session_key = SecureRandom.urlsafe_base64(20)
                    $redis.hset("sess:#{session_key}", "user_id", current_user.id.to_s)
                    $redis.expire("sess:#{session_key}", 3600)
                    jwt = JWT.encode(session_key, ENV['JWT_HKEY'])
                    return_uri = make_signin_token(session_key, session[:signin_return], session[:rtnstate], jwt)
                    redirect_to(return_uri) and return
                end
            end
            #otherwise, we just present them with the signin screen
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
            signin_return, rtnstate = signin_user(user.id.to_s)
            if signin_return
                # set session_key for future authorization
                session_key = SecureRandom.urlsafe_base64(20)
                $redis.hset("sess:#{session_key}", "user_id", user.id.to_s)
                $redis.expire("sess:#{session_key}", 3600)
                # enter the session_key into a JWT for the client to save
                jwt = JWT.encode(session_key, ENV['JWT_HKEY'])
                return_uri = make_signin_token(session_key, signin_return, rtnstate, jwt)
                redirect_to(return_uri) and return
            elsif session[:return_to]
              internal_rt = session[:return_to]
              session[:return_to] = nil
              redirect_to(internal_rt) and return
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
        verify_token = params[:token].to_s
        jwt, rtnstate = $redis.lrange("jtoken:#{verify_token}", 0, -1)
        if jwt && rtnstate
            $redis.del("jtoken:#{verify_token}")
            render :json => {"jwt" => jwt, "rtnstate" => JSON.parse(rtnstate)} and return
        else
            render(:nothing => true, :status => 401) and return
        end
    end

    def signed_in
        if current_dashboard_user
            render :json => {"signedin" => {"handle" => current_dashboard_user.handle,
                                            "screenname" => current_dashboard_user.screenname,
                                            "id" => current_dashboard_user.id.to_s,
                                            "pic" => current_dashboard_user.profile_image(true)}}
        elsif current_user
          render :json => {"signedin" => {"handle" => current_user.handle,
                                          "screenname" => current_user.screenname,
                                          "id" => current_user.id.to_s,
                                          "pic" => current_user.profile_image(true)}}
        else
            render :json => {"signedin" => false}
        end
    end

    def signout_submit
        if session[:user_id].present?
            $redis.keys("sess:*").each do |k|
                u = $redis.hget(k, "user_id")
                $redis.del(k) if u == session[:user_id]
            end
        end
        reset_session
        redirect_to(root_url)
    end

    def dashboard_signout
        if matcher = /Bearer[\s]+token=\"([^"]+)\"/i.match(request.headers['HTTP_AUTHORIZATION'])
          $redis.del("sess:#{JWT.decode(matcher[1], ENV['JWT_HKEY'])}")
        end
        reset_session
        uri = URI(params[:rtn].to_s)
        if Context.find_by("channel_info.allowed_rdr_hosts" => uri.host)
            return_uri = %Q{#{uri.scheme}://#{uri.host}/#/}
            redirect_to(return_uri) and return
        else
            redirect_to(root_url)
        end

    end

    ##
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
        signin_return = session[:signin_return]
        internal_rt = session[:return_to]
        rtnstate = session[:rtnstate]
        reset_session
        session[:user_id] = user_id
        session[:return_to] = internal_rt
        [signin_return, rtnstate]
    end

    def make_signin_token(session_key, signin_return, rtnstate, jwt)
        session[:sess] = session_key
        # make a temporary token for the client to retrieve
        # the jwt and the return state
        signin_jwt_token = SecureRandom.urlsafe_base64(20)
        $redis.rpush("jtoken:#{signin_jwt_token}", jwt)
        $redis.rpush("jtoken:#{signin_jwt_token}", rtnstate)
        $redis.expire("jtoken:#{signin_jwt_token}", 30)
        # return the temp token to the client's signin-state uri
        signin_return + signin_jwt_token
    end


    def add_cors_headers
      response.headers["Access-Control-Allow-Origin"] = "*"
      response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
      response.headers["Access-Control-Allow-Credentials"] = "true"
      response.headers["Access-Control-Allow-Headers"] = "x-csrf-token, authorization, accept, content-type"
    end

end
