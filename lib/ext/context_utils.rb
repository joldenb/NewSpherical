module ContextUtils
    private
    def parse_tags(input_tags=[])
        if input_tags.nil?
            []
        else
            tags = input_tags.map{|t| t if t.present?}.compact
        end
    end

    def topic_struct
        TopicalTopic.new({:display_name => params[:topic_name], 
                            :description => params[:topic_description],
                            :tags => parse_tags(params[:topic_tags]), 
                            :visibility => params[:visibility]}).topic
    end

end