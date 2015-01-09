class SphereController < ApplicationController
    after_filter :add_cors_headers
    include AdminChecks

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
        user = current_dashboard_user
      elsif current_user
        user = current_user
      else
        render :json => {"signedin" => false} and return
      end
      is_curator = false
      ctx_id = params[:ctx_id] ? params[:ctx_id].to_s : nil
      if admin_in_any_ctx || valid_role(user.id, ctx_id, ['curator'])
        is_curator = true
      end
      render :json => {"signedin" => {
        "handle" => user.handle,
        "screenname" => user.screenname,
        "curator" => is_curator,
        "id" => user.id.to_s,
        "pic" => user.profile_image('nopicdrk'),
        "bigpic" => user.profile_image('nopic58')}} and return




        # if current_dashboard_user
        #     render :json => {"signedin" => {"handle" => current_dashboard_user.handle,
        #                                     "screenname" => current_dashboard_user.screenname,
        #                                     "id" => current_dashboard_user.id.to_s,
        #                                     "pic" => current_dashboard_user.profile_image('nopicdrk'),
        #                                     "bigpic" => current_dashboard_user.profile_image('nopic58')}}
        # elsif current_user
        #   render :json => {"signedin" => {"handle" => current_user.handle,
        #                                   "screenname" => current_user.screenname,
        #                                   "id" => current_user.id.to_s,
        #                                   "pic" => current_user.profile_image('nopicdrk'),
        #                                   "bigpic" => current_user.profile_image('nopic58')}}
        # else
        #     render :json => {"signedin" => false}
        # end
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

    def entities
      if !current_user && !current_dashboard_user
        render(:nothing => true, :status => 401) and return
      end
      ctx = params[:ctx_id].present? ? Context.find_by(:identifier => params[:ctx_id].to_s) : Context.find_by(:identifier => "planetwork")
      entities = []
      EntityAgent.get_entities(ctx, :limit => 24).each do |entity|
        if thisentity = entity.profiles.where(:is_default => true).first
          profile_text = thisentity.profiletxt ||"No Profile Yet"
        else
          profile_text = "No Profile Yet"
        end
        t = entity.created_at
        entities << {:id => entity.id.to_s,
                      :itemtype => 'profile',
                      :screenname => entity.screenname,
                      :profile_image => entity.profile_image('nopic58'),
                      :signupdate => t.strftime("%B #{t.day.ordinalize}, %Y"),
                      :profile_text => profile_text}
      end
      render(:json => {:participants => entities}) and return
    end

    def curators
      if !current_user && !current_dashboard_user
        render(:nothing => true, :status => 401) and return
      end
      ctx = params[:ctx_id].present? ? Context.find_by(:identifier => params[:ctx_id].to_s) : Context.find_by(:identifier => "planetwork")
      curators = []
      EntityAgent.get_curators(ctx, :limit => 24).each do |curator|
        if thiscurator = curator.profiles.where(:is_default => true).first
          profile_text = thiscurator.profiletxt ||"No Profile Yet"
        else
          profile_text = "No Profile Yet"
        end
        t = curator.created_at
        curators << {:id => curator.id.to_s,
                      :itemtype => 'profile',
                      :screenname => curator.screenname,
                      :profile_image => curator.profile_image('nopic58'),
                      :signupdate => t.strftime("%B #{t.day.ordinalize}, %Y"),
                      :profile_text => profile_text}
      end
      render(:json => {:curators => curators}) and return
    end

    def cloud
      if params[:mode] == 'user'
        if spheres = current_user_spheres
          thesespheres = []
          spheres.each do |sphere|
            thesespheres << {:ident => sphere.identifier,
                              :name => sphere.display_identifier,
                              :spherelogo => sphere.channel_info.sphere_logo,
                              :dashlogo => sphere.channel_info.dashboard_logo,
                              :dashurl => sphere.channel_info.dashboard_url}
          end
          render(:json => {:spheres => thesespheres})
        else
          render(:nothing => true, :status => 401) and return
        end
      elsif params[:mode] == 'demo'
        spheres = []
        spheres << {:ident => 'planetwork',
                    :name => 'Buckminster Fuller Institute',
                    :spherelogo => 'BFI_logo-sphere4.png',
                    :dashlogo => 'BFI-3x5.png',
                    :dashurl => 'http://sandbox.planetwork.net/#/sphere'}
        spheres << {:ident => 'ran',
          :name => 'Rainforest Action Network',
          :spherelogo => 'RANLogo_sphere1.png',
          :dashlogo => nil,
          :dashurl => nil}
        spheres << {:ident => 'bioneers',
          :name => 'Bioneers',
          :spherelogo => 'Bioneers_sphere.png',
          :dashlogo => 'Bioneers-3x5.png',
          :dashurl => 'http://sandbox2.planetwork.net/#/sphere'}
        spheres << {:ident => 'agu',
          :name => 'American Geophysical Union',
          :spherelogo => 'AGU1.png',
          :dashlogo => nil,
          :dashurl => nil}
        spheres << {:ident => 'balle',
          :name => 'BALLE',
          :spherelogo => 'BALLE1.png',
          :dashlogo => nil,
          :dashurl => nil}
        spheres << {:ident => 'pachamama',
          :name => 'Pachamama Alliance',
          :spherelogo => 'Pachamama1.png',
          :dashlogo => nil,
          :dashurl => nil}
        spheres << {:ident => 'wiser',
          :name => 'WiserEarth',
          :spherelogo => 'WiserEarth2.png',
          :dashlogo => nil,
          :dashurl => nil}

        render(:json => {:spheres => spheres})

      else
        if sphere = Context.find_by(:identifier => params[:mode].to_s)
          thissphere = {:ident => sphere.identifier,
                        :name => sphere.display_identifier,
                        :spherelogo => sphere.channel_info.sphere_logo,
                        :dashlogo => sphere.channel_info.dashboard_logo,
                        :dashurl => sphere.channel_info.dashboard_url}
          render(:json => {:spheres => [thissphere]})
        else
          render(:nothing => true, :status => 404) and return
        end
      end
    end

    ##
    private

    def current_user_spheres
      if current_user
        thisuser = current_user
      elsif current_dashboard_user
        thisuser = current_dashboard_user
      else
        return nil
      end

      spheres = []
      thisuser.entity_contexts.each do |ec|
        sphere = Context.find(ec.context_id)
        spheres << sphere if sphere.context_types.include?("Channel")
      end
      spheres
    end

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
