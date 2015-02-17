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
      dashuri = URI(dashboard_origin)
      if channelctx = Context.find_by("channel_info.allowed_rdr_hosts" => dashuri.host)
          @topics = ContextAgent.new(:context => channelctx).get_relations
          @topic_imgs = {}
          @topics.each do |topic|
              ## label the topic with the image from the first story
              top_story_id = topic.item_contexts.
              order_by(:context_id => "asc", :elevation => "desc", :sort_order => "desc").
              first.item_id
              @topic_imgs[topic.id.to_s] = Item.find(top_story_id).image_src
          end

          @dashboard_logo = channelctx.channel_info.dashboard_logo
          @channelname = channelctx.display_identifier
          @channel_identifier = channelctx.identifier
          @channelstories = ItemAgent.get_items(channelctx) + ItemAgent.get_top_stories(channelctx, {:initial => true})
          @channel_ctx_id = channelctx.id.to_s
          @topics.unshift(channelctx)
          if @channelstories.present?
            @topic_imgs[channelctx.id.to_s] = Item.find(@channelstories.first.first.id).image_src
          end

          @channeldiscussions = ItemAgent.get_items(channelctx, :types => ['discussion'])
          @channeldiscussions.each do |cditem|
            if author = Entity.find(cditem[0].submitter)
              t = cditem[0].updated_at
              author_info = {"author_handle" => author.handle, "thumb" => author.profile_image, "pubdate" => t.strftime("%B #{t.day.ordinalize}, %Y")}
              cditem << author_info
            end
            citations_info = []
            cditem[0].citations.each do |cite_id|
              if cite = Item.find(cite_id)
                citations_info << {"id" => cite_id, "pic" => cite.image_src, "article_uri" => cite.article_uri, "description" => cite.headline}
              end
            end
            cditem << citations_info
          end
      else
          render(:text => request.remote_ip, :status => 404) and return
      end
    end

    def topic_items
      if params[:id] =~ RMongoIdRegex
        context = Context.find(params[:id])
        @items = ItemAgent.get_items(context)
        if params[:is_channel] == "true"
          @items += ItemAgent.get_top_stories(context, {:initial => true})
        end
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
              citations_info << {"id" => cite_id, "pic" => cite.image_src, "article_uri" => cite.article_uri, "description" => cite.headline}
            end
          end
          item << citations_info
        end
        render :topic_items
      else
        render :nothing => true, :status => 404
      end
    end

    def upload_resource_file
      if current_user
        user = current_user
      elsif current_dashboard_user
        user = current_dashboard_user
      end
      render(:json => {:success => false, :msg => "Please log in."}, :status => 401) and return unless user

      if params[:resrc].is_a?(ActionDispatch::Http::UploadedFile)
        if parent_item = Item.find(params[:resource_id])
          if parent_item.resource_files.find_by(:filename =>  params[:resrc].original_filename)
            render :json => {"success" => false, :msg => "File already exists."}, :status => 409 and return
          end
          rf = ResourceFile.new
          rf.rfile = params[:resrc]
          rf.filename = params[:resrc].original_filename
          parent_item.resource_files << rf
          resource_list = parent_item.resource_files.map{|rfile| [rfile.filename, rfile.id.to_s, parent_item.id.to_s]}
          render :json => {"success" => true, :resource_list => resource_list} and return
        else
          render :json => {"success" => false, :msg => "No resource found."} and return
        end
        render(:text => result) and return
      else
        render(:nothing => true, :status => 400) and return
      end
    end

    def remove_resource_file
      if current_user
        user = current_user
      elsif current_dashboard_user
        user = current_dashboard_user
      end
      render(:json => {:success => false, :msg => "Please log in."}, :status => 401) and return unless user

      if params[:rsrc] =~ RMongoIdRegex
        rsrc = params[:rsrc]
      else
        render(:json => {:success => false, :msg => "Resource not valid."}, :status => 404) and return
      end
      if params[:fileid] =~ RMongoIdRegex
        fileid = params[:fileid]
      else
        render(:json => {:success => false, :msg => "File not valid."}, :status => 404) and return
      end

      if parent_resource = Item.find(rsrc)
        if parent_resource.submitter == user.id
          begin
            FileUtils.rm_r("#{Rails.root}/public/uploads/resource_file/#{fileid}")
          rescue
            nil
          end
          if rf = parent_resource.resource_files.find(fileid)
            rf.destroy
          end
          parent_resource.reload
          resource_list = parent_resource.resource_files.map{|rfile| [rfile.filename, rfile.id.to_s, parent_resource.id.to_s]}
          render :json => {"success" => true, :resource_list => resource_list} and return
        else
          render(:json => {:success => false, :msg => "You do not own this resource."}, :status => 401) and return
        end
      else
        render(:json => {:success => false, :msg => "Resource not found."}, :status => 404) and return
      end
    end

    def delete_resource
      if ItemAgent.destroy_item(params[:resourceid])
        render :json => {"success" => true} and return
      else
        render :json => {"success" => false} and return
      end
    end

    def check_resource_name
      if current_user
        user = current_user
      elsif current_dashboard_user
        user = current_dashboard_user
      end
      render(:nothing => true, :status => 401) and return unless user

      if params[:resource_ctx] =~ RMongoIdRegex
        if params[:resource_name].present?
          if item = Item.find_by(:resource_name => params[:resource_name])
            if params[:resource_id] != item.id.to_s && item.item_contexts.find_by(:context_id => params[:resource_ctx])
              render(:json => {:success => false, :msg => "Resource name already taken."}) and return
            else
              render(:json => {:success => true}) and return
            end
          end
        else
          render(:json => {:success => false, :msg => "Blank name"}) and return
        end
      else
        render(:json => {:success => false, :msg => "Bad context"}) and return
      end
    end

    def save_new_resource
      if current_user
        user = current_user
      elsif current_dashboard_user
        user = current_dashboard_user
      end
      render(:nothing => true, :status => 401) and return unless user
      f = HTML::FullSanitizer.new

      if params[:resource_ctx] =~ RMongoIdRegex
        unless valid_role(user.id, params[:resource_ctx], ['curator']) || admin_in_any_ctx
          render(:json => {:success => false, :msg => "Not a curator."}) and return
        end
        oid = SecureRandom.uuid
        name = f.sanitize(params[:resource_name])
        if params[:resource_urls].present?
          urls = params[:resource_urls].map do |url|
            f.sanitize(url) if url.present?
          end.compact.uniq
        else
          urls = nil
        end
        begin
          rsrc = ItemAgent.new(params[:resource_ctx], {
            :oid => oid,
            :resource_name => name,
            :resource_urls => urls,
            :submitter => user.id
            }).create_or_update_resource_item
        rescue Exception => e
          render(:json => {:success => false, :msg => e.message}) and return
        end
        if rsrc.kind_of?(Item)
          render(:json => {:success => true, :msg => "Created resource.", :rsrc_id => rsrc.id.to_s}) and return
        else
          render(:json => {:success => false, :msg => "Create resource failed."}) and return
        end
      else
        render(:nothing => true, :status => 404) and return
      end
    end

    def save_resource
      if current_user
        user = current_user
      elsif current_dashboard_user
        user = current_dashboard_user
      end
      render(:nothing => true, :status => 401) and return unless user
      f = HTML::FullSanitizer.new

      if resource = Item.find(params[:resource_id].to_s)
        if resource.submitter != user.id
          render(:json => {:success => false, :msg => "Not resource owner."}) and return
        end
        if params[:resource_ctx] =~ RMongoIdRegex
          unless valid_role(user.id, params[:resource_ctx], ['curator']) || admin_in_any_ctx
            render(:json => {:success => false, :msg => "Not a curator."}) and return
          end
          oid = resource.oid
          name = f.sanitize(params[:resource_name])
          resource_description = f.sanitize(params[:resource_description])
          if params[:resource_urls].present?
            urls = params[:resource_urls].map do |url|
              f.sanitize(url) if url.present?
            end.compact.uniq
          else
            urls = nil
          end
          begin
            rsrc = ItemAgent.new(params[:resource_ctx], {
              :oid => oid,
              :resource_name => name,
              :headline => resource_description,
              :resource_urls => urls,
              :show_in_resources => true
              }).create_or_update_resource_item
          rescue Exception => e
            render(:json => {:success => false, :msg => e.message}) and return
          end

          render(:json => {:success => true, :msg => "Resource saved!"}) and return
        end
      else
        render(:nothing => true, :status => 404) and return
      end
    end

    ##
    private


    def add_cors_headers
      response.headers["Access-Control-Allow-Origin"] = "*"
      response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
      response.headers["Access-Control-Allow-Credentials"] = "true"
      response.headers["Access-Control-Allow-Headers"] = "x-csrf-token, authorization, accept, content-type, cache-control, x-requested-with"
    end

  end
