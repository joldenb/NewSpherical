class PersonalSettingsController < ApplicationController
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
        session[:return_to] = "/personal_settings/profile"
        redirect_to("/sphere/signin") and return
      end
      render :layout => 'application'
    end

    def edit_profile
      render(:nothing => true, :status => 401) and return unless current_user
      screen_name = current_user.screen_name.present? ? current_user.screen_name : current_user.handle
      render :json => {:email => current_user.email, :screen_name => screen_name}
    end

    def change_password

    end

    def upload_profile_pic
        render(:nothing => true, :status => 401) and return unless current_user
        render(:nothing => true, :status => 403) and return unless params[:ppic].is_a?(ActionDispatch::Http::UploadedFile)

        if current_user.update_attributes(:profile_pic => params[:ppic])
          render :json => {"success" => true}
        else
          render :json =>  {"success" => false, "msg" => current_user.errors.to_json}
        end
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


end
