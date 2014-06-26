class LinkTvNewsFeed
    class ResponseNotOK < StandardError; end
    class XMLFailure < StandardError; end
    Article = Struct.new(:oid, 
                          :headline, 
                          :text, 
                          :image_src, 
                          :article_uri, 
                          :media_link,
                          :media_link2,
                          :timestamp)
    
    def initialize
        @conn = Faraday.new(:url => LinkTV[:base]) do |faraday|
          faraday.adapter :net_http
        end
        @s = HTML::WhiteListSanitizer.new
        @f = HTML::FullSanitizer.new
    end

    def get_rss(topic)
        response = @conn.get do |req|
          req.url(LinkTV[:topics][topic])
          req.headers['Accept'] = 'application/xml'
        end
        raise(ResponseNotOK, response.status.to_s) unless response.status == 200
        begin
          doc = Nokogiri::XML(response.body)
          results = doc.xpath("//item")
        rescue => e
          raise XMLFailure, e.message
        end
        results.map {|article| Article.new(
          @f.sanitize(article.at_css("guid").text),
          @f.sanitize(article.at_css("title").text.encode("utf-8")),
          targetize_links(@s.sanitize(article.at_css("description").text.encode("utf-8"))),
          @f.sanitize(article.xpath("media:thumbnail").attribute("url").value),
          @f.sanitize(article.at_css("link").text),
          @f.sanitize(article.xpath("enclosure").attribute("url").value),
          mp4_to_ogv_link(@f.sanitize(article.xpath("enclosure").attribute("url").value)),
          parse_time(article.at_css("pubDate").text))
        }.reverse
    end

    private
    def parse_time(time_string)
      Time.parse(time_string).to_i rescue Time.now.to_i
    end

    def mp4_to_ogv_link(mp4_link)
      md = /\A([\w\W]+)\.mp4\z/.match(mp4_link)
      %Q{#{md[1]}.ogv}
    end

    def targetize_links(description)
      description.gsub(/<(a[^>]+)>/, '<\1 target="_blank">')
    end
    
end