json.topics do
    json.array! @topics do |topic|
        json.id topic.id.to_s
        json.name topic.display_identifier
        json.pic @topic_imgs[topic.id.to_s]
        json.itemtype 'topic'
    end
end
json.dashlogo "#{ENV['FULLHOST']}assets/#{@dashboard_logo}"
json.channelname @channelname
json.channelstories @channelstories
json.channeldiscussions @channeldiscussions
json.channel_ctx_id @channel_ctx_id
json.channel_identifier @channel_identifier
