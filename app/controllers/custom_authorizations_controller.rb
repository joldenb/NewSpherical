class CustomAuthorizationsController < Doorkeeper::AuthorizationsController
    def new
        if pre_auth.authorizable?
          if Doorkeeper::AccessToken.matching_token_for(pre_auth.client, current_resource_owner.id, pre_auth.scopes) || skip_authorization?
            auth = authorization.authorize
            if request.xhr?
                session[:authn_in_progress] = nil
                session[:authz_in_progress] = nil
                session[:redirect_uri] = nil
                render :text => auth.redirect_uri
            else
                redirect_to auth.redirect_uri
            end
          else
            if request.xhr?
                render :new, :layout => false
            else
                session[:authz_in_progress] = session[:authn_in_progress]
                redirect_to root_url(:oauth => true)
            end
          end
        else
            session[:authn_in_progress] = nil
            session[:authz_in_progress] = nil
            session[:redirect_uri] = nil
            render :error, :layout => false
        end
    end


    def authenticate_resource_owner!
        params.delete(:action)
        session[:authn_in_progress] = params.to_query
        session[:redirect_uri] = params[:redirect_uri]
        super
    end

    
end