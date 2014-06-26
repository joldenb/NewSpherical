class CuratorsNewsFeed
    class ResponseNotOK < StandardError; end
    class XMLFailure < StandardError; end
    Article = Struct.new( :oid, 
                          :headline, 
                          :text,
                          :image_src,
                          :timestamp,
                          :submitter)
    
    def initialize
      @s = HTML::WhiteListSanitizer.new
      @f = HTML::FullSanitizer.new
    end

    def get_item(params)
        Article.new(
          prepare_oid(params[:oid]),
          @f.sanitize(params[:headline]),
          prepare_description(@s.sanitize(params[:item_description])),
          @f.sanitize(params[:image_src]),
          Time.now.to_i,
          )
    end

    private
    def targetize_links(description)
      description.gsub(/<(a[^>]+)>/, '<\1 target="_blank">')
    end

    def prepare_description(description)
      targetize_links(description.strip.
        truncate(RecommendedItemChars, :omission => '...').
        gsub(/[\r\n]/, '<br />'))
    end

    def prepare_oid(oid)
      if oid.strip.present?
        @f.sanitize(oid.strip)
      else
        SecureRandom.uuid
      end
    end
    
end