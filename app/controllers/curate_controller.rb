class CurateController < ApplicationController
  require 'timeout'

  def feeddata
    unless current_user || current_dashboard_user
      render(:nothing => true, :status => 401) and return
    end

    f = HTML::FullSanitizer.new
    @doc_uri = f.sanitize(URI.decode(params[:r]))

    begin
      Timeout.timeout(30) do
        @doc = Pismo::Document.new(@doc_uri, :image_extractor => true, :all_images => true)
      end
    rescue Timeout::Error => e
      render(:text => "Unable to retrieve information.", :status => 400) and return
    rescue SocketError => e
      render(:text => "Apparently malformed URL.", :status => 400) and return
    rescue Exception => e
      render(:text => "Sorry, something went wrong: #{e.message}", :status => 400) and return
    else
      @images = @doc.images
      @headline = @doc.title
      @text = @doc.body.gsub(/\n/, "\n\n").truncate(RecommendedItemChars, :omission => '...')
    end
  end

  def feed
    f = HTML::FullSanitizer.new
    @doc_uri = f.sanitize(params[:r])
    unless current_user
      session[:return_to] = "/curate/feed?r=#{@doc_uri}"
      redirect_to(root_url) and return
    else
      session[:return_to] = nil
      session[:feed_doc_uri] = @doc_uri
    end
  end

  def add_feed_item
    render(:nothing => true, :status => 401) and return unless current_user

    oid = Digest::SHA1.hexdigest(session[:feed_doc_uri].sub(/https?:\/\//, '').gsub(/\/$/, ''))
    unless feed_sphere = Context.find_by(:identifier => params[:feed_sphere])
      feed_sphere = Context.find_by(:identifier => 'planetwork')
    end
    article_params = {:oid => oid,
                      :headline => params[:headline],
                      :text => params[:text],
                      :image => params[:image],
                      :doc_uri => session[:feed_doc_uri],
                      :submitter => current_user.id.to_s}
    article = SphericalNewsFeed.new(article_params).article
    begin
      new_item = ItemAgent.new(feed_sphere.identifier, article).create_or_elevate_spherical_item
      if new_item.kind_of?(Item)
        rdr = session[:feed_doc_uri]
        session[:feed_doc_uri] = nil
        render :json => {"success" => true, "message" => "Added Article", "rdr" => rdr} and return
      else
        render :json => {"success" => false, "message" => "Failed to create item."} and return
      end
    rescue Exception => e
      render :json => {"success" => false, "message" => e.message} and return
    end


  end
end
