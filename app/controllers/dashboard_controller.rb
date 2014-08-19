class DashboardController < ApplicationController
    layout false
    after_filter :add_cors_headers
    include ContextUtils
    include AdminChecks
    include ActionView::Helpers::DateHelper

    def spherical_loader
      respond_to do |format|
        format.js
      end
    end

    def spherical_dashboard
      respond_to do |format|
        format.js
      end
    end

    def init
    end

    def home
    end

    ##TODO replace these templates with direct serve from nginx
    def topic_swiper
      render 'dashboard/tpls/topic_swiper'
    end

    def item_swiper
      render 'dashboard/tpls/item_swiper'
    end


    def sphereinfo
      if channelctx = Context.find_by(:identifier => "planetwork")
          @topics = ContextAgent.new(:context => channelctx).get_relations
          @topic_imgs = {}
          @topics.each do |topic|
              top_story_id = topic.item_contexts.
              order_by(:context_id => "asc", :elevation => "desc", :sort_order => "desc").
              first.item_id
              @topic_imgs[topic.id.to_s] = Item.find(top_story_id).image_src
          end
          @dashboard_logo = channelctx.channel_info.dashboard_logo
      else
          render(:text => request.remote_ip, :status => 404) and return
      end
    end

    def topic_items
      if params[:id] =~ RMongoIdRegex
        context = Context.find(params[:id])
        @items = ItemAgent.get_items(context)
      else
        render :nothing => true, :status => 404
      end
    end

    def discussion_items
      if params[:id] =~ RMongoIdRegex
        context = Context.find(params[:id])
        @items = ItemAgent.get_items(context, :types => ['discussion'])
        @items.each do |item|
          if author = Entity.find(item[0].submitter)
            t = item[0].updated_at
            author_info = {"author_handle" => author.handle, "thumb" => author.profile_image, "pubdate" => t.strftime("%B #{t.day.ordinalize}, %Y")}
            item << author_info
          end
          citations_info = []
          item[0].citations.each do |cite_id|
            if cite = Item.find(cite_id)
              citations_info << {"pic" => cite.image_src, "article_uri" => cite.article_uri, "description" => cite.headline}
            end
          end
          item << citations_info
        end
        render :topic_items
      else
        render :nothing => true, :status => 404
      end
    end

    ##
    private


    def add_cors_headers
      response.headers["Access-Control-Allow-Origin"] = "*"
      response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
      response.headers["Access-Control-Allow-Credentials"] = "true"
      response.headers["Access-Control-Allow-Headers"] = "x-csrf-token, authorization, accept, content-type"
    end

  end
