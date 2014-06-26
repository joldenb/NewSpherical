json.topics do
    json.array! @topics do |topic|
        json.id topic.id.to_s
        json.name topic.display_identifier
        json.pic @topic_imgs[topic.id.to_s]
        json.itemtype 'topic'
    end
end
json.dashlogo "#{ENV['FULLHOST']}assets/#{@dashboard_logo}"