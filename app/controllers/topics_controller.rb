class TopicsController < ApplicationController
    layout false
    include ContextUtils
    after_filter :add_cors_headers

    def preview_new_topic
        render(:nothing => true, :status => 401) and return unless admin_in_any_ctx("curator")
        begin
            new_topic = topic_struct
        rescue TopicalTopic::ParamsError => e
            render(:json => {:success => false, :message => e.message}) and return
        end
        render(:json => {:success => true, :new_topic => new_topic.to_json}) and return
    end

    def create_new_topic
        render(:nothing => true, :status => 401) and return unless admin_in_any_ctx("curator")
        begin
            topic = topic_struct
            new_topic = ContextAgent.new({:topic => topic, :creator => current_user.id}).create_new_public_topic
        rescue TopicalTopic::ParamsError => e
            render(:json => {:success => false, :message => e.message}) and return
        end
        render(:json => {:success => true, :display_name => new_topic.display_name}) and return
    end

    def check_identifier
        if  params[:topic_name].present?
            @f = HTML::FullSanitizer.new
            name = @f.sanitize(params[:topic_name].strip)
            if RTopicnameRegex =~ name
                display_name = name
            else
                display_name = name[0..10]
            end
            identifier = display_name.parameterize
            available = !Context.where(:identifier => identifier).first
            render(:json => {:available => available, :identifier => identifier}) and return
        else
            render(:json => {:available => false, :identifier => ""}) and return
        end
    end

    def topic_relations
        if @ctx = Context.find(params[:ctx])
            render(:nothing => true, :status => 401) and return unless valid_admin(@ctx.id, ["curator"])
            related = @ctx.ctx_relations.map{|r| r.related_to}
            @related_topics = Context.where(:_id.in => related).limit(12).asc(:identifier).to_ary
            filtered = related << @ctx.id
            @all_topics = Context.all(:context_types => ["Public Topic"]).and(:_id.nin => filtered).limit(18).asc(:identifier).to_ary
            render :partial => "topic_relations", :locals => {:topic_results => @all_topics,
                                                              :related_topics => @related_topics} and return
        else
            render(:nothing => true, :status => 404) and return
        end
    end

    def add_topic_relations
        if @ctx = Context.find(params[:ctx])
            render(:nothing => true, :status => 401) and return unless valid_admin(@ctx.id, ["curator"])
        end
        begin
            ContextAgent.new(:context => @ctx, relations: params[:relations]).add_relations
            render(:json => {:success => true}) and return
        rescue Exception => e
            render(:json => {:success => false, :message => e.message}) and return
        end
    end

    def remove_topic_relations
        if @ctx = Context.find(params[:ctx])
            render(:nothing => true, :status => 401) and return unless valid_admin(@ctx.id, ["curator"])
        end
        begin
            ContextAgent.new(:context => @ctx, relations: params[:relations]).remove_relations
            render(:json => {:success => true}) and return
        rescue Exception => e
            render(:json => {:success => false, :message => e.message}) and return
        end
    end

    def search_topics
        if @ctx = Context.find(params[:ctx])
            render(:nothing => true, :status => 401) and return unless valid_admin(@ctx.id, ["curator"])
            @f = HTML::FullSanitizer.new
            search_term = @f.sanitize(params[:search_term].strip)
            dispname_rgx = Regexp.new("^#{search_term}", true)
            identfr_rgx = Regexp.new("^#{search_term.parameterize.gsub(/\-/, '\-')}")
            related = @ctx.ctx_relations.map{|r| r.related_to}
            filtered = related << @ctx.id
            topic_results = Context.all(:context_types => ["Public Topic"]).
            or({:identifier => identfr_rgx}, {:display_name => dispname_rgx}).
            and(:_id.nin => filtered).limit(12).
            asc(:identifier).to_ary
            render :partial => "available_topics", :locals => {:topics => topic_results}
        else
            render(:nothing => true, :status => 404) and return
        end
    end

    def elevate_item
      unless item = Item.find(params[:item_id])
        render(:nothing => true, :status => 404) and return
      end

      if current_dashboard_user
        userid = current_dashboard_user.id
      elsif current_user
        userid = current_user.id
      else
        render(:json => {"message" => "Please sign in."}, :status => 401) and return
      end

      elv = ItemAgent.new('*', {:item_id => item.id,
                                  :entity_id => userid}).elevate_item
      if elv >= 1
        render :json => {"success" => true, "message" => "Elevated!"} and return
      elsif elv.zero?
        render :json => {"success" => false, "message" => "Already Elevated"} and return
      else
        render :json => {"success" => false, "message" => "Elevation Failed"} and return
      end

    end

    private

    def add_cors_headers
      response.headers["Access-Control-Allow-Origin"] = "*"
      response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
      response.headers["Access-Control-Allow-Credentials"] = "true"
      response.headers["Access-Control-Allow-Headers"] = "x-csrf-token, authorization, accept, content-type"
    end


end
