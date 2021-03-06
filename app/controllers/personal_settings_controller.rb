class PersonalSettingsController < ApplicationController
    after_filter :add_cors_headers
    layout false

    def settings
        render(:nothing => true, :status => 401) and return unless current_user

        mychannel_topics, topic_results = my_channel_data
        render :partial => "settings",
                            :locals => {:mychannel_topics => mychannel_topics,
                            :topic_results => topic_results} and return
    end

    def add_topics_to_my_channel
        render(:nothing => true, :status => 401) and return unless current_user

        ContextAgent.new(:entity_id => current_user.id, :relations => params[:relations]).add_mychannel_relations
        mychannel_topics, topic_results = my_channel_data
        render :partial => "my_channel_settings",
                            :locals => {:mychannel_topics => mychannel_topics,
                            :topic_results => topic_results} and return

    end

    def remove_topics_from_my_channel
        render(:nothing => true, :status => 401) and return unless current_user

        ContextAgent.new(:entity_id => current_user.id, :relations => params[:relations]).remove_mychannel_relations
        mychannel_topics, topic_results = my_channel_data
        render :partial => "my_channel_settings",
                            :locals => {:mychannel_topics => mychannel_topics,
                            :topic_results => topic_results} and return
    end

    def search_topics
        render(:nothing => true, :status => 401) and return unless current_user

        @f = HTML::FullSanitizer.new
        search_term = @f.sanitize(params[:search_term].strip)
        dispname_rgx = Regexp.new("^#{search_term}", true)
        identfr_rgx = Regexp.new("^#{search_term.parameterize.gsub(/\-/, '\-')}")
        filtered = get_mychannel_topics
        topic_results = Context.all(:context_types => ["Public Topic"]).
        or({:identifier => identfr_rgx}, {:display_name => dispname_rgx}).
        and(:_id.nin => filtered).
        asc(:identifier).to_ary

        render :partial => "my_channel_topics", :locals => {:topic_results => topic_results}
    end

    def personal_profile
        render(:nothing => true, :status => 401) and return unless current_user
        render :partial => "personal_profile"
    end

    def profile
      unless current_user
        render(:nothing => true, :status => 401) and return
      end
    end

    def edit_profile
      render(:nothing => true, :status => 401) and return unless current_user
      screen_name = current_user.screen_name.present? ? current_user.screen_name : current_user.handle
      render :json => {:email => current_user.email, :screen_name => screen_name}
    end

    def unique_email_check
      current_user_id = current_user ? current_user.id : nil
      email = params[:email].to_s.strip
      email_unique = EntityAgent.unique_email(email, current_user_id)
      render(:json => {:email_unique => email_unique}) and return
    end

    def unique_screenname_check
      current_user_id = current_user ? current_user.id : nil
      screenname = params[:screenname].to_s.strip
      screenname_unique = EntityAgent.unique_screen_name(screenname, current_user_id)
      render(:json => {:screenname_unique => screenname_unique}) and return
    end

    def update_profile
      render(:nothing => true, :status => 401) and return unless current_user
      screenname = params[:screenname].to_s.strip.gsub(/[\s]+/, ' ')
      email = params[:email].to_s.strip
      if (screenname.present?)
        unless screenname_unique = EntityAgent.unique_screen_name(screenname, current_user.id)
          render(:json => {:msg => "Screen name not unique"}, :status => 403) and return
        end
      end
      unless email_unique = EntityAgent.unique_email(email, current_user.id)
        render(:json => {:msg => "Email not unique"}, :status => 403) and return
      end

      if current_user.update_attributes(:screen_name => screenname, :email => email)
        render(:json => {:msg => "Updated profile"}) and return
      else
        render(:json => {:msg => current_user.errors.full_messages.join(', ')}, :status => 403) and return
      end
    end

    def edit_profile_text
      if current_dashboard_user
        profile_user = current_dashboard_user
      elsif current_user
        profile_user = current_user
      else
        render :json =>  {"success" => false, "msg" => "please sign in"} and return
      end

      unless params[:userid] == profile_user.id.to_s
        render :json =>  {"success" => false, "msg" => "bad user"} and return
      end

      ctx = params[:ctx_id].present? ? Context.find_by(:identifier => params[:ctx_id]) : Context.find_by(:identifier => "planetwork")
      s = HTML::WhiteListSanitizer.new
      profile_text = s.sanitize(params[:profile_text])

      if profile = profile_user.profiles.where(:context => ctx.id).first
        profile.update_attributes(:profiletxt => profile_text, :admin_generated => false)
        render :json =>  {"success" => true, "msg" => "profile edited"} and return
      else
        profile = Profile.new(:profiletxt => profile_text,
                                :context => ctx.id,
                                :admin_generated => false)
        profile_user.profiles << profile
        render :json =>  {"success" => true, "msg" => "profile created"} and return
      end
    end

    def change_password
      render(:json => {:msg => "Please sign in"}, :status => 401) and return unless current_user
      if params[:password].present? && params[:pwd_confirm].present?
        password = params[:password].to_s.strip
        pwd_confirm = params[:pwd_confirm].to_s.strip
      else
        render(:json => {:msg => "Error : incomplete data"}, :status => 403) and return
      end

      if password == pwd_confirm
        result = EntityAgent.update_password(current_user.id, password, pwd_confirm)
        if result == "Updated password"
          render(:json => {:msg => result}) and return
        else
          render(:json => {:msg => result}, :status => 403) and return
        end
      else
        render(:json => {:msg => "Error : password not confirmed"}, :status => 403) and return
      end
    end

    def upload_profile_pic
        render(:nothing => true, :status => 401) and return unless current_user
        render(:nothing => true, :status => 403) and return unless params[:ppic].is_a?(ActionDispatch::Http::UploadedFile)

        if !current_user.profile_pic
          pp = ProfilePic.new
          pp.pic = params[:ppic]
          current_user.profile_pic = pp
          render :json => {"success" => true} and return
        else
          if current_user.profile_pic.update_attributes(:pic => params[:ppic])
            render :json => {"success" => true}
          else
            render :json =>  {"success" => false, "msg" => current_user.errors.to_json}
          end
        end
    end

    def tools
      render(:nothing => true, :status => 401) and return unless current_user
    end

    private
    def get_mychannel_topics
        my_channel = EntityAgent.get_my_channel(current_user.id)
        my_channel_related = my_channel.ctx_relations.map{|r| r.related_to}
        Context.where(:_id.in => my_channel_related).asc(:identifier).to_ary
    end
    def my_channel_data
        mychannel_topics = get_mychannel_topics
        topic_results = Context.all(:context_types => ["Public Topic"]).and(:_id.nin => mychannel_topics).asc(:identifier).to_ary
        [mychannel_topics, topic_results]
    end

    def add_cors_headers
      response.headers["Access-Control-Allow-Origin"] = "*"
      response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
      response.headers["Access-Control-Allow-Credentials"] = "true"
      response.headers["Access-Control-Allow-Headers"] = "x-csrf-token, authorization, accept, content-type"
    end

end
