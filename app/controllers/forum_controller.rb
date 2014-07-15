class ForumController < WebsocketRails::BaseController
    include ActionView::Helpers::DateHelper

    def initialize_session

    end

    def new_client
        new_message = {:message => "Welcome #{current_user.handle}."}
        send_message :welcome, new_message
    end

    def close_client
        #delete the current user from each topic channel to which they may be sub'd.
        #keys are channel names prefixed with "prsnc"
        $redis.keys("prsnc*").each do |p|
            if $redis.hdel(p, current_user.handle) > 0
                ctx_id = p.sub('prsnc', '')
                WebsocketRails[ctx_id].trigger(:forum_presence_message, {:msg => $redis.hkeys(p), :tlm => ctx_id}.to_json)
            end
        end
        connection.close!
    end

    def count_clients
        ctx_id = message[:ctx_id]
        #value set to Time.now so stale hkeys can be swept
        $redis.hset("prsnc#{ctx_id}", current_user.handle, Time.now.to_i)
        #broadcast the new presence array to users on this channel
        WebsocketRails[ctx_id].trigger(:forum_presence_message, {:msg => $redis.hkeys("prsnc#{ctx_id}")}.to_json)
        #send connected users array to user joining this channel
        new_message = {:message => $redis.hkeys("prsnc#{ctx_id}")}.to_json
        send_message :client_count, new_message
    end

    def recent_messages
        ctx_id = message[:ctx_id] =~ RMongoIdRegex ? message[:ctx_id] : nil
        ctx = Context.find(ctx_id)
        message_collection = []
        ctx.forum_messages.order_by(:created_at => :desc).limit(10).each do |msg|
            message = {}
            message[:timestamp] = time_ago_in_words(msg.created_at)
            message[:text] = msg.message
            author = Entity.find(msg.author_id)
            message[:author] = author.handle
            message[:thumb] = author.profile_image
            message_collection << message
        end
         
        if ctx
            trigger_success({:message => message_collection.to_json})
        else
            trigger_failure({:message => "--#{ctx.identifier}"})
        end
    end

    private
    def current_user
        @user ||= Entity.find(session[:user_id])
    end

end