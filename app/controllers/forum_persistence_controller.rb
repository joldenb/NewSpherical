class ForumPersistenceController < ApplicationController
    after_filter :add_cors_headers
    include ActionView::Helpers::DateHelper


    def save_forum_post
      if !current_dashboard_user
        render(:json => {"error" => "signin required"}, :status => 401) and return
      end
      if params[:ctx_id] =~ RMongoIdRegex && params[:post_id] =~ RMongoIdRegex
        unless ctx = Context.find(params[:ctx_id])
          render(:json => {"error" => "Context not found."}, :status => 404) and return
        end
        #unless valid_admin(ctx.id, ["curator"])
        #  render(:nothing => true, :status => 401) and return
        #end
        unless post = Item.find(params[:post_id])
          render(:json => {"error" => "Post not found."}, :status => 404) and return
        end
        message = HTML::FullSanitizer.new.sanitize(params[:forum_post_text])
        if message.present?
          new_message = ForumMessage.new(:author_id => current_dashboard_user.id, :message => message)
          post.forum_messages << new_message
          forum_update = {}
          forum_update[:timestamp] = time_ago_in_words(new_message.created_at)
          forum_update[:text] = new_message.message
          forum_update[:author] = current_dashboard_user.handle
          forum_update[:thumb] = current_dashboard_user.profile_image
          WebsocketRails[post.id.to_s].trigger(:new_forum_message, {:msg => forum_update}.to_json)
          render :json => {"success" => true} and return
        else
          render(:json => {"error" => "No text."}, :status => 404) and return
        end
      else
        render(:json => {"error" => "No context."}, :status => 404) and return
      end
    end

    def save_conversation_post
      if !current_dashboard_user
        render(:json => {"error" => "signin required"}, :status => 401) and return
      end
      post = DiscussionPost.new.format_post(params)
      context = params[:topic]
      author = current_dashboard_user.id.to_s
      post_hash = Hash[post.each_pair.to_a]
      post_hash["submitter"] = author

      item = ItemAgent.new(context, post_hash).create_or_update_feed_item("discussion")
      render(:json => {:saved => item.id}) and return
    end


    #
    private

    def add_cors_headers
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Headers"] = "x-csrf-token, authorization, accept, content-type"
    end
end
