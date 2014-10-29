class InviteeEmailer
    @queue = :mailgun
    def self.perform(inviteparams)
      logfile = "#{Rails.root}/log/mailgun.log"
      log = File.new(logfile, 'a')
      log.sync = true
      t = Time.now.strftime("%F at %T")

      thisctx = inviteparams[:thisctx]
      current_user = inviteparams[:current_user]
      recipient = inviteparams[:recipient]
      invite = inviteparams[:invite]
      sphere = inviteparams[:sphere]
      role = inviteparams[:role]
      ps = inviteparams[:ps].present? ? %Q{P.S. #{inviteparams[:ps]}} : ""
      headline = inviteparams[:headline]
      statename = inviteparams[:statename]
      stateparams = inviteparams[:stateparams]
      current_user_email = inviteparams[:current_user_email]
      current_user_screename = inviteparams[:current_user_screename]
      share_url = inviteparams[:share_url]
      access_key = inviteparams[:access_key]
      dashboard_url = inviteparams[:dashboard_url]


      begin
        @conn = Faraday.new(:url => "https://api:#{ENV['MAILGUN_KEY']}@api.mailgun.net") do |faraday|
          faraday.request  :url_encoded
          faraday.adapter :net_http
        end

        response = @conn.post do |req|
          params = {}
          req.url "/v2/mg.spherical.io/messages"
          params[:to] = recipient
          if current_user_email =~ EmailAddressesParser::DEFAULT_REGEX
            params[:from] = current_user_email
            params[:reply_to] = current_user_email
          else
            params[:from] = "admin@spherical.io"
            params[:reply_to] = "admin@spherical.io"
          end
          params[:subject] = "Spherical Invitation"
          link_host = ENV['FULLHOST']
          salutation = recipient
          params[:text] = self.text(recipient, access_key, sphere, ps, salutation, link_host, headline, dashboard_url, current_user_screename)
          req.body = params
        end

        if response.status == 200
          log.write("#{t} Invite #{recipient}\n")
        else
          log.write("#{t} Invite #{recipient} failed:#{response.status}\n")
        end
      rescue Exception => e
        log.write("#{t} Invite error #{e}\n")
        raise
      end
    end

    def self.text(recipient, access_key, sphere, ps, salutation, link_host, headline, dashboard_url, current_user_screename)
      if headline
        self.email_article_text(recipient, access_key, sphere, ps, salutation, link_host, headline, dashboard_url, current_user_screename)
      else
        self.email_text(recipient, access_key, sphere, ps, salutation, link_host, current_user_screename)
      end
    end

    def self.email_text(recipient, access_key, sphere, ps, salutation, link_host, current_user_screename)
        %Q{To: #{salutation},

#{current_user_screename} has invited you to join the #{sphere} sphere, part of Spherical.

If you wish to accept, please click on the following link:
<#{link_host}invite/accept/#{access_key}>

Spherical is a private demo site.  By accepting this invitation you agree to abide by our terms of non-disclosure available at <https://spherical.io/nda>.

If you don't wish to accept, you may just ignore this email.

#{ps}

-----------------------------------------------------------
This invitation was sent to #{recipient}.
If you do not wish to accept, you may just ignore it.
If you do not wish to receive any more invitations like this,
please click on the following link:
<#{link_host}invite/opt_out/#{access_key}>}
    end

    def self.email_article_text(recipient, access_key, sphere, ps, salutation, link_host, headline, dashboard_url, current_user_screename)
              %Q{To: #{salutation},

#{current_user_screename} would like to share the following item on the #{sphere} sphere with you:

#{headline}
<#{dashboard_url}/#/invitation/#{access_key}>

You are also invited to join the #{sphere} sphere, part of Spherical.

Clicking on the link above will bring you to the shared item, where an optional invitation link will be also be waiting for you.

#{ps}

-----------------------------------------------------------
This invitation was sent to #{recipient}.
If you do not wish to accept, you may just ignore it.
If you do not wish to receive any more invitations like this,
please click on the following link:
<#{link_host}invite/opt_out/#{access_key}>}
    end
end
