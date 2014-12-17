class SphericalNewsFeed
    Article = Struct.new(:oid, :headline, :text, :image_src,
                         :article_uri, :submitter, :timestamp)

    def initialize(params={})
        @s = HTML::WhiteListSanitizer.new
        @f = HTML::FullSanitizer.new
        @params = params
    end

    def article
      text = @params[:text].truncate(RecommendedItemChars, :omission => '...')
      Article.new( @params[:oid],
                    @f.sanitize(@params[:headline]),
                    @s.sanitize(text),
                    @f.sanitize(@params[:image]),
                    @f.sanitize(@params[:doc_uri]),
                    @params[:submitter],
                    Time.now.to_i)
    end

end
