class InviteController < ApplicationController
    layout false

    def invitations_form
      if params[:group_id] =~ RMongoIdRegex
        if ctx = Context.find(params[:group_id])
          # an admin or whatever the Context#ctx_settings_list#can_invite is set to
          if valid_admin(ctx.id, [ctx.ctx_settings_list.can_invite])
            render :partial => "send_email_invitations", 
                                :locals => {:ctx_id => ctx.id, 
                                            :ctx_name => ctx.display_identifier} and return
          else
            render(:nothing => true, :status => 401) and return
          end
        else
          render(:nothing => true, :status => 404) and return
        end
      else
        render(:nothing => true, :status => 404) and return
      end
    end

    def invite_with_article_form
      if params[:group_id] =~ RMongoIdRegex
        if ctx = Context.find(params[:group_id])
          # an admin or whatever the Context#ctx_settings_list#can_invite is set to
          if valid_admin(ctx.id, [ctx.ctx_settings_list.can_invite])
            if params[:article_id] && ctx.item_contexts.map{|i| i.item_id.to_s}.include?(params[:article_id])
                if article = Item.find(params[:article_id])
                    render :partial => "invite_with_article", 
                                        :locals => {:ctx_id => ctx.id, 
                                                    :ctx_name => ctx.display_identifier,
                                                    :article => article,
                                                    :position => params[:position].to_i} and return
                else
                    render(:nothing => true, :status => 404) and return
                end
            else
                render(:nothing => true, :status => 422) and return
            end
          else
            render(:nothing => true, :status => 401) and return
          end
        else
          render(:nothing => true, :status => 404) and return
        end
      else
        render(:nothing => true, :status => 404) and return
      end
    end

    def send_invitations
        if params[:context] =~ RMongoIdRegex
            if ctx = Context.find(params[:context])
                if valid_admin(ctx.id, [ctx.ctx_settings_list.can_invite])
                    failed_items = {}
                    successes = 0
                    invited_role = (%w{participant curator demo}.include?(params[:role])) ? params[:role] : "participant"
                    valid_items_hash, invalid_items_array = EmailAddressesParser.parse_list(params[:invitation_addresses])
                    valid_items_hash.each do |email, realname|
                        should_invite, message = invite?(email, ctx.id)
                        if should_invite
                            f = HTML::FullSanitizer.new
                            text = f.sanitize(params[:invitation_text].strip)
                            sig = f.sanitize(params[:invitation_sig].strip)
                            if text.to_s.empty?
                                text = "This is an invitation to join the #{ctx.display_identifier} Topical group."
                            end
                            if sig.to_s.empty?
                                sig = "Warm regards,\r\nThe Topical Admins"
                            end

                            article_id = (params[:article_id] =~ RMongoIdRegex) ? params[:article_id] : nil

                            access_key = SecureRandom.urlsafe_base64(20)
                            if invitee = Invitee.new(:inviter => current_user.id, 
                                                        :email => email, 
                                                        :invitee_name => realname, 
                                                        :access_key => access_key,
                                                        :invited_role => invited_role,
                                                        :view_article => article_id)
                                ctx.invitees << invitee
                                #Resque.enqueue(InviteeEmailer, current_user.email, email, access_key, ctx.display_identifier, text, sig, article_id, realname)
                                InviteeEmailer.perform(current_user.email, email, access_key, ctx.display_identifier, text, sig, article_id, realname)
                                successes += 1
                            end
                        else
                            case message
                            when "global"
                                failed_items[:global_optout] ||= []
                                failed_items[:global_optout] << email
                            when "optout"
                                failed_items[:optout] ||= []
                                failed_items[:optout] << email
                            when "active"
                                failed_items[:active] ||= []
                                failed_items[:active] << email
                            when "invited"
                                failed_items[:invited] ||= []
                                failed_items[:invited] << email
                            else
                                failed_items[:unknown] ||= []
                                failed_items[:unknown] << email
                            end
                        end
                    end
                    render :json => {:successes => successes, 
                                    :invalid => invalid_items_array, 
                                    :failed => failed_items,
                                    :ctx_name => ctx.display_identifier} and return
                else
                    render(:nothing => true, :status => 401) and return
                end  
            else
                render(:nothing => true, :status => 404) and return
            end
        else
            render(:nothing => true, :status => 404) and return
        end
    end

    def accept
        if !session[:invite_token]
            session[:invite_token] = params[:token]
            redirect_to root_url and return
        else
            token = session[:invite_token]
            session[:invite_token] = nil
            if invitee = Invitee.where(:access_key => token).first
                if !invitee.accepted && !invitee.opted_out && !invitee.globally_opted_out
                    @ctx = invitee.context
                    @message = "You have been invited to join the #{@ctx.display_identifier} Planetwork group."
                    session[:invitee_id] = invitee.id
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
        end
    end

    def opt_out
        if !session[:opt_out_token]
            session[:opt_out_token] = params[:token]
            redirect_to root_url and return
        else
            token = session[:opt_out_token]
            if invitee = Invitee.where(:access_key => token).first
                if !invitee.accepted && !invitee.opted_out && !invitee.globally_opted_out
                    @ctx = invitee.context
                    @ctx_name = invitee.context.display_identifier
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
        end
    end

    def process_opt_out
        if !session[:opt_out_token]
            render(:nothing => true, :status => 404) and return
        else
            if invitee = Invitee.where(:access_key => session[:opt_out_token]).first
                if params[:opt_out] == "global"
                    invitee.update_attributes(:globally_opted_out => true)
                    render :json => {"success" => true, "notice" => "You are opted-out from all Planetwork groups."} and return
                else
                    invitee.update_attributes(:opted_out => true)
                    render :json => {"success" => true, "notice" => "You are opted-out from the #{invitee.context.display_identifier} Planetwork group."} and return
                end
            else
                render(:nothing => true, :status => 401) and return
            end
            session[:opt_out_token] = nil
        end
    end

    private

    def invite?(email, ctx_id)
        raise "Invalid email" unless EmailAddressesParser::DEFAULT_REGEX =~ email
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
end