class ApplicationController < ActionController::Base
  protect_from_forgery
  include AdminChecks
  before_filter :require_autht_in_xhr, :has_remember_me
  helper_method :current_user, :is_mobile?, :valid_admin, :channelctx

  ## in Rack::MobileDetect the target regex returns "Android" only if the device is NOT a mobile
  ## see config in application.rb
  def is_mobile?
    request.headers['X_MOBILE_DEVICE'].present? #&& request.headers['X_MOBILE_DEVICE'] != "Android"
  end

  def current_user
    if session[:user_id].present?
        Entity.find(session[:user_id])
    end
  end

  def authenticity_token_verified?
    session[:_csrf_token] == params[:authenticity_token] || session[:_csrf_token] == request.headers['X-CSRF-Token']
  end
  
  def require_autht_in_xhr
    ## The authenticity_token is always set in our xhr requests
    ## by topical_utils.js ajaxSend method
    if request.xhr? && !authenticity_token_verified?
      reset_session
      logger.warn "WARNING: XHR without CSRF token" if logger
      render(:nothing => true, :status => 401) and return
    end
  end

  def has_remember_me
    unless session[:user_id].present?
      if cookies[:remember_me].present?
        if user = Entity.where(:remember_me_token => cookies[:remember_me]).first
          update_remember_me_token(user)
          reset_session
          session[:user_id] = user.id
        end
      end
    end
  end

  def update_remember_me_token(user)
    new_token = SecureRandom.hex(32)
    user.update_attributes(:remember_me_token => new_token)
    cookies[:remember_me] = { :value => new_token,
                              :expires => 2.weeks.from_now,
                              :httponly => true
                            }
  end

  def channelctx
    Context.find_by("channel_info.ip_addresses" => request.remote_ip)
  end
end
