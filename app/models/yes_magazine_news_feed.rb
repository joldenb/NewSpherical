class YesMagazineNewsFeed
    class ResponseNotOK < StandardError; end
    class XMLFailure < StandardError; end
    Article = Struct.new(:oid, 
                          :headline, 
                          :text,
                          :article_uri,
                          :image_src,
                          :timestamp)
    
    def initialize
        @conn = Faraday.new(:url => YesMagazine[:base]) do |faraday|
          faraday.adapter :net_http
        end
        @s = HTML::WhiteListSanitizer.new
        @f = HTML::FullSanitizer.new
    end

    def get_rss(topic)
        response = @conn.get do |req|
          req.url(YesMagazine[:topics][topic])
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
          @f.sanitize(article.at_css("link").text),
          extract_image(article.xpath('./content:encoded', 'content' => 'http://purl.org/rss/1.0/modules/content/').text),
          parse_time(article.at_css("pubDate").text))
        }.reverse
    end

    private
    def parse_time(time_string)
      Time.parse(time_string).to_i rescue Time.now.to_i
    end

    def extract_image(html)
      result = nil
      h = Nokogiri::HTML(html)
      if h.html?
        h.css('img').each do |image| 
          src = image.attribute("src").value
          if src =~ /yesmagazine\.org/
            result = src
            break
          end
        end
      end
      @f.sanitize(result)
    end


    def targetize_links(description)
      description.gsub(/<(a[^>]+)>/, '<\1 target="_blank">')
    end
    
end