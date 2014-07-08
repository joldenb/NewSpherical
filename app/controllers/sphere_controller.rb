class SphereController < ApplicationController
    after_filter :add_cors_headers

    def signin_token
        uri = URI(params[:rtn].to_s)
        if Context.find_by("channel_info.allowed_rdr_hosts" => uri.host)
            token = SecureRandom.urlsafe_base64(20)
            rtnstate = {"statename" => params[:statename],
                        "stateparams" => params[:stateparams]}.to_json
            #token_value = [%Q{#{uri.scheme}://#{uri.host}/#/signin/}, rtnstate]
            $redis.rpush("sntoken:#{token}", %Q{#{uri.scheme}://#{uri.host}/#/signin/})
            $redis.rpush("sntoken:#{token}", rtnstate)
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
            session[:signin_return], session[:rtnstate] = signin_token_value
            $redis.del("sntoken:#{token}")
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
                # make a temporary token for the client to retrieve 
                # the jwt and the return state
                signin_jwt_token = SecureRandom.urlsafe_base64(20)
                #token_value = [jwt, rtnstate]
                $redis.rpush("jtoken:#{signin_jwt_token}", jwt)
                $redis.rpush("jtoken:#{signin_jwt_token}", rtnstate)
                $redis.expire("jtoken:#{signin_jwt_token}", 30)
                # return the temp token to the client's signin state uri
                return_uri = signin_return + signin_jwt_token
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
        verify_token = params[:token].to_s
        jwt, rtnstate = $redis.lrange("jtoken:#{verify_token}", 0, -1)
        if jwt && rtnstate
            $redis.del("jtoken:#{verify_token}")
            render :json => {"jwt" => jwt, "rtnstate" => JSON.parse(rtnstate)} and return
        else
            render(:nothing => true, :status => 401) and return
        end    
    end

    def user_ctlpanel_data
        panels = []
        if current_dashboard_user
            panels << {:bg => {'background-color' => '#0080c9'},
            :text => 'My Profile',
            :highlight =>  true}
            panels << {:bg => {'background' => "#88BCE2 url(#{ENV['FULLHOST']}assets/adduser.png) no-repeat 50% 60px"},
             :highlight =>  true,
             :text =>  'Invite',
             :action =>  'expand',
             :expanded_bg =>  'drkblue',
             :destination =>  'invite_form'}
            panels << {:bg => {'background' => "#0080c9 url(#{ENV['FULLHOST']}assets/login-icon.png) no-repeat 50% 60px"},
             :highlight =>  true,
             :text =>  "Sign Out",
             :action =>  'signout',
             :current_user => current_dashboard_user.handle}
            panels << {:bg => {'background' => "#073a70 url(#{ENV['FULLHOST']}assets/close_dashboard.png) no-repeat 50% 60px"},
             :highlight =>  true,
             :text =>  'Close Dashboard',
             :action =>  'close'}
            panels << {:bg => {'background-color' => '#2672EC'},
                :text => 'My Channel',
            :highlight =>  true}
            panels << {:bg => {'background-color' => '#2E8DEF'},
                :text => 'Tools',
            :highlight =>  true}
            panels << {:bg => {'background-color' => '#557C30'},
                :text => 'Settings',
            :highlight =>  true}
            panels << {:bg => {'background-color' => '#88BCE2'},
                :text => 'Forum',
            :highlight =>  true}
        else
            panels << {:bg => {'background-color' => '#0080c9'},
                :text => 'My Profile'}
            panels << {:bg => {'background' => "#88BCE2 url(#{ENV['FULLHOST']}assets/adduser.png) no-repeat 50% 60px"},
             :highlight =>  true,
             :text =>  'Sign Up for New Account',
             :action =>  'expand',
             :expanded_bg =>  'drkblue',
             :destination =>  'signup_form'}
            panels << {:bg => {'background' => "#0080c9 url(#{ENV['FULLHOST']}assets/login-icon.png) no-repeat 50% 60px"},
             :highlight =>  true,
             :text =>  'Sign In',
             :action =>  'signin'}
            panels << {:bg => {'background' => "#073a70 url(#{ENV['FULLHOST']}assets/close_dashboard.png) no-repeat 50% 60px"},
             :highlight =>  true,
             :text =>  'Close Dashboard',
             :action =>  'close'}
            panels << {:bg => {'background-color' => '#2672EC'},
                :text => 'My Channel'}
            panels << {:bg => {'background-color' => '#2E8DEF'},
                :text => 'Tools'}
            panels << {:bg => {'background-color' => '#557C30'},
                :text => 'Settings'}
            panels << {:bg => {'background-color' => '#88BCE2'},
                :text => 'Forum'}
        end
        render(:json => {:panels => panels})
    end

    def signout_submit
        reset_session
        render :signin
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
        rtnstate = session[:rtnstate]
        reset_session
        session[:user_id] = user_id
        [signin_return, rtnstate]
    end
    

    def add_cors_headers
      response.headers["Access-Control-Allow-Origin"] = "*"
      response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
      response.headers["Access-Control-Allow-Credentials"] = "true"
      response.headers["Access-Control-Allow-Headers"] = "x-csrf-token, authorization, accept, content-type"
    end
    
end