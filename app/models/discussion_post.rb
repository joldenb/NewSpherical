class DiscussionPost
    Post = Struct.new(:oid, 
                      :headline, 
                      :text,
                      :citations,
                      :timestamp)
    
    def initialize
        @s = HTML::WhiteListSanitizer.new
        @f = HTML::FullSanitizer.new
    end

    def format_post(params)
      Post.new(
        @f.sanitize(params["uid"]),
        @f.sanitize(params["title"]),
        targetize_links(@s.sanitize(params["content"])),
        validate_citations(params["citations"]),
        params["timestamp"].present? ? params["timestamp"].to_i :  Time.now.to_i)
    end

    private
    def validate_citations(citation_array)
      citation_array ||= []
      citation_array.map{|citation| RMongoIdRegex =~ citation ? citation : nil}.compact
    end

    def targetize_links(description)
      description.gsub(/<(a[^>]+)>/, '<\1 target="_blank">')
    end
    
end