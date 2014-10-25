class InviteController < ApplicationController
    layout false
    after_filter :add_cors_headers

    def card
      unless current_user
        render(:nothing => true, :status => 401) and return
      end
      ## this is temporary until we have actual spheres to invite into
      ## then choosing a sphere will modify the ctx_id ng-model
      @ctx_id = Context.find_by(:identifier => "planetwork").id
    end

    def with_share
      unless current_dashboard_user
        render(:nothing => true, :status => 401) and return
      end
      if REmailRegex =~ params[:invite_email]
        recipient = params[:invite_email]
      else
        render(:msg => "Invalid email", :status => 400) and return
      end

      f = HTML::FullSanitizer.new
      inviteparams = {}
      inviteparams[:current_user] = current_dashboard_user
      inviteparams[:recipient] = recipient
      inviteparams[:also_invite] = params[:also_invite]
      inviteparams[:sphere] = f.sanitize(params[:invite_sphere])
      inviteparams[:role] = params[:role]
      inviteparams[:ps] = f.sanitize(params[:email_ps])
      inviteparams[:headline] = f.sanitize(params[:headline])
      inviteparams[:statename] = params[:statename]
      inviteparams[:stateparams] = params[:stateparams]
      inviteparams[:current_user_email] = current_dashboard_user.email
      inviteparams[:current_user_screename] = current_dashboard_user.screenname
      inviteparams[:share_url] = f.sanitize(params[:share_url])
      if params[:invite_ctx] =~ RMongoIdRegex
        inviteparams[:thisctx] = Context.find(params[:invite_ctx])
      elsif params[:invite_ctx].present?
        inviteparams[:thisctx] = Context.find_by(:identifier => params[:invite_ctx])
      end


      if inviteparams[:also_invite].present?
        message, status = create_invitation(inviteparams)
        render(:json => {:msg => message}, :status => status) and return
      else
        begin
          ShareEmailer.perform(inviteparams)
          render(:json => {:msg => "message sent"}) and return
        rescue Exception => e
          render(:json => {:msg => e.message}, :status => 400) and return
        end
      end
    end

    def send_invitation
      unless current_user
        render(:nothing => true, :status => 401) and return
      end
      if REmailRegex =~ params[:invite_email]
        invite_email = params[:invite_email]
      else
        render(:json => {:msg => "Invalid email"}, :status => 400) and return
      end

      f = HTML::FullSanitizer.new
      inviteparams = {}
      inviteparams[:current_user] = current_user
      inviteparams[:recipient] = invite_email
      inviteparams[:invite] = true
      inviteparams[:sphere] = f.sanitize(params[:invite_sphere])
      inviteparams[:role] = params[:role]
      inviteparams[:ps] = f.sanitize(params[:invitation_ps])
      inviteparams[:current_user_email] = current_user.email
      inviteparams[:current_user_screename] = current_user.screenname
      if params[:invite_ctx] =~ RMongoIdRegex
        inviteparams[:thisctx] = Context.find(params[:invite_ctx])
      elsif params[:invite_ctx].present?
        inviteparams[:thisctx] = Context.find_by(:identifier => params[:invite_ctx]).id.to_s
      end

      message, status = create_invitation(inviteparams)
      render(:json => {:msg => message}, :status => status) and return
    end

    def info
      token = params[:token]
      if invitee = Invitee.find_by(:access_key => token)
        if !invitee.accepted && !invitee.opted_out && !invitee.globally_opted_out
          render(:json => {:invited => true,
                            :statename => invitee.article_statename,
                            :stateparams => invitee.article_stateparams}) and return
        else
          render(:json => {:invited => false, :msg => "Invitation not active"}) and return
        end
      else
        render(:json => {:invited => false, :msg => "Invitee not found"}) and return
      end
    end

    def accept
      reset_session
      token = params[:token]
      if invitee = Invitee.where(:access_key => token).first
          if !invitee.accepted && !invitee.opted_out && !invitee.globally_opted_out
              @ctx = invitee.context
              @message = "You have been invited to join the #{invitee.sphere_name} Sphere."
              session[:invitee_id] = invitee.id
              session[:invitee_email] = invitee.email
              if existing_entity = Entity.where(:email => invitee.email).first
                  @new_group_invite = true
              end

              if invitee.view_article.present?
                  if article = Item.find(invitee.view_article)
                      if article.submitter =~ RMongoIdRegex
                          author = Entity.find(article.submitter).handle
                      else
                          author = nil
                      end
                      @article = {:item => article,
                                :author => author}
                  end
              end
          else
              if invitee.accepted
                  @error_message = "You have already accepted this invitation."
              else
                  @error_message = "You have already opted-out."
              end
          end
      else
          @error_message = "Sorry, invalid access token."
      end
      render :layout => "application"
    end

    def opt_out
      token = session[:opt_out_token] = params[:token]
      if invitee = Invitee.where(:access_key => token).first
          if !invitee.accepted && !invitee.opted_out && !invitee.globally_opted_out
              @ctx = invitee.context
              @ctx_name = invitee.context.display_identifier
              @sphere_name = invitee.sphere_name
              @message = "Invitation Opt-Out"
              @accept_link = %Q{#{ENV['FULLHOST']}invite/accept/#{token}}
          else
              if invitee.accepted
                  @error_message = "You have already accepted this invitation."
              else
                  @error_message = "You have already opted-out."
              end
          end
      else
          @error_message = "Sorry, invalid access token."
      end
      render :layout => "application"
    end

    def process_opt_out
        if !session[:opt_out_token]
            render(:nothing => true, :status => 403) and return
        else
            if invitee = Invitee.find_by(:access_key => session[:opt_out_token])
                if params[:opt_out] == "global"
                    invitee.update_attributes(:globally_opted_out => true)
                    render :json => {"success" => true, "notice" => "You are opted-out from all Spherical groups."} and return
                else
                    invitee.update_attributes(:opted_out => true)
                    render :json => {"success" => true, "notice" => "You are opted-out from the #{invitee.sphere_name} Spherical group."} and return
                end
            else
                session[:opt_out_token] = nil
                render :json => {"success" => false, "notice" => "Invalid access token."} and return
            end
            session[:opt_out_token] = nil
        end
    end

    def invitable
      ctx_id = params[:ctx_id].present? ? params[:ctx_id].to_s : Context.find_by(:identifier => "planetwork").id
      begin
        invite, message = invite?(params[:email], ctx_id)
      rescue Exception => e
        invite, message = false, e.message
      end
      case message
      when "global", "optout"
        msg = "opted out"
      when "active"
        msg = "already active"
      when "invited"
        msg = "already invited"
      else
        msg = ""
      end
      render(:json => {:success => invite, :message => msg})
    end

    private

    def invite?(email, ctx_id)
        raise "Invalid email" unless REmailRegex =~ email
        in_context, already_invited, opted_out, globally_opted_out =  nil, nil, nil, nil
        if existing_user = Entity.where(:email => email).first
          in_context = !!EntityContext.where(:entity_id => existing_user.id, :context_id => ctx_id).first
        end
        Invitee.where(:email => email).each do |invitee|
          if invitee
            if invitee.context_id == ctx_id
              already_invited = true
              opted_out = true if invitee.opted_out
            end
            globally_opted_out = true if invitee.has_globally_opted_out?
          end
        end

        ## email in invitations and globally opted-out
        if globally_opted_out
          invite, message = false, "global"
        ## email in context-invitations and opted-out
        elsif opted_out
          invite, message = false, "optout"
        ## email in user and context
        elsif in_context
          invite, message = false, "active"
        ## email in context-invitations and not opted-out
        elsif already_invited
          invite, message = false, "invited"
        ## email in user but not context or context-invitations
        elsif existing_user
          invite, message = true, "existing"
        ## email not found in users or invitations
        else
          invite, message = true, ""
        end

        [invite, message]
    end

    def create_invitation(inviteparams)
      message, status = nil, nil

      if inviteparams[:thisctx].kind_of?(Context)
        ctx = inviteparams[:thisctx]
        if valid_role(inviteparams[:current_user], ctx.id, [ctx.ctx_settings_list.can_invite])
          should_invite, message = invite?(inviteparams[:recipient], ctx.id)
          case message
            when "global", "optout"
              msg = "opted out"
            when "active"
              msg = "already active"
            when "invited"
              msg = "already invited"
            else
              msg = ""
            end
          invited_role = (%w{participant curator demo}.include?(inviteparams[:role])) ? inviteparams[:role] : "participant"
          realname = '' ##TODO
          dshbrd = URI(ctx.dashboard_url)
          inviteparams[:dashboard_url] = %Q{#{dshbrd.scheme}://#{dshbrd.host}}
          if should_invite
              ps = inviteparams[:ps]
              inviteparams[:access_key] = SecureRandom.urlsafe_base64(20)
              if invitee = Invitee.new(
                :inviter => inviteparams[:current_user].id,
                :email => inviteparams[:recipient],
                :invitee_name => realname,
                :access_key => inviteparams[:access_key],
                :invited_role => inviteparams[:role],
                :sphere_name => inviteparams[:sphere],
                :view_article => inviteparams[:headline],
                :article_statename => inviteparams[:statename],
                :article_stateparams => inviteparams[:stateparams])
                ctx.invitees << invitee
                begin
                  InviteeEmailer.perform(inviteparams)
                rescue Exception => e
                  message = e.message
                  status = 500
                else
                  message = "invitation sent"
                  status = 200
                end
              else
                message = "Couldn't create invitee"
                status = 400
              end #if invitee
            else
              message = msg
              status = 400
            end #should_invite
          else
            message = "You don't have invite permissions"
            status = 400
          end #if valid_admin
        else
          message = "Invalid context object"
          status = 400
        end #kind_of?(Context)

        [message, status]
    end


    def add_cors_headers
      response.headers["Access-Control-Allow-Origin"] = "*"
      response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
      response.headers["Access-Control-Allow-Credentials"] = "true"
      response.headers["Access-Control-Allow-Headers"] = "x-csrf-token, authorization, accept, content-type"
    end
end
