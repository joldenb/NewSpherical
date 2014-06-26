class TopicalTopic
    class ParamsError < StandardError; end
    Topic = Struct.new(:display_name, :identifier, :desc, :tags, :vis)
    
    def initialize(params={})
        @s = HTML::WhiteListSanitizer.new
        @f = HTML::FullSanitizer.new
        @params = params
    end

    def topic
      raise ParamsError, "No topic name found" unless @params[:display_name].present?
      name = @f.sanitize(@params[:display_name].strip)
      if RTopicnameRegex =~ name
        display_name = name
      else
        display_name = name[0..10]
      end
      display_name.strip!
      identifier = display_name.parameterize
      description = @s.sanitize(@params[:description].strip)[0..279]
      if @params[:tags].kind_of?(Array) && !@params[:tags].empty?
        tags = @params[:tags].map{|t| t.to_s.strip.downcase.gsub(RNotInTagsRegex, '')}.map{|tx| tx if tx.present?}.compact
      else
        tags = []
      end
      visibility = %w{participants all}.include?(@params[:visibility]) ? @params[:visibility] : "participants"

      errors = []
      errors << "a name" if display_name.empty?
      errors << "a description" if description.empty?

      if errors.present?
        raise ParamsError, "Please enter #{errors.join(' and ')}."
      else
        Topic.new(display_name, identifier, description, tags, visibility)
      end
    end
    
end