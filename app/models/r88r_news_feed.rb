class R88rNewsFeed
    class ResponseNotOK < StandardError; end
    class JSONFailure < StandardError; end
    Article = Struct.new(:oid, :headline, :text, :image_src, :image_width, :image_height,
                         :article_uri, :source_uri, :source_name, :timestamp)

    def initialize
        @conn = Faraday.new(:url => R88R[:base]) do |faraday|
          faraday.adapter :net_http
        end
        @s = HTML::WhiteListSanitizer.new
        @f = HTML::FullSanitizer.new
    end

    def get_headlines(topic, page=0)
        response = @conn.get do |req|
          req.url R88R[:topics][topic]
          req.headers['Accept'] = 'application/json'
        end
        raise(ResponseNotOK, response.status.to_s) unless response.status == 200
        begin
          result = ActiveSupport::JSON.decode(response.body.strip.gsub(/[\n\r]+/, ',').chomp(','))
        rescue => e
          raise JSONFailure, e.message
        end
        result["data"]["headlines"].map{|article| Article.new(@s.sanitize(article["oid"]),
                                                      @s.sanitize(article["headline"].encode("utf-8")),
                                                      @f.sanitize(article["abstract"].encode("utf-8")),
                                                      @s.sanitize(article["img"]["src"]),
                                                      article["img"]["width"].to_i,
                                                      article["img"]["height"].to_i,
                                                      @s.sanitize(article["uri"]),
                                                      @s.sanitize(article["source"]["url"]),
                                                      @s.sanitize(article["source"]["name"]),
                                                      article["ts"].to_i)}.reverse
    end

end
