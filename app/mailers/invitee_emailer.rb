class InviteeEmailer
    @queue = :mailgun
    def self.perform(sender, recipient, access_key, groupname, ps, article_id=nil, name=nil)
      logfile = "#{Rails.root}/log/mailgun.log"
      log = File.new(logfile, 'a')
      log.sync = true
      t = Time.now.strftime("%F at %T")
      begin
        @conn = Faraday.new(:url => "https://api:#{ENV['MAILGUN_KEY']}@api.mailgun.net") do |faraday|
          faraday.request  :url_encoded
          faraday.adapter :net_http
        end

        response = @conn.post do |req|
          params = {}
          req.url "/v2/mg.spherical.io/messages"
          params[:to] = recipient
          if sender =~ EmailAddressesParser::DEFAULT_REGEX
            params[:from] = sender
            params[:reply_to] = sender
          else
            params[:from] = "admin@spherical.io"
            params[:reply_to] = "admin@spherical.io"
          end
          params[:subject] = "Spherical Invitation"
          link_host = ENV['FULLHOST']
          access_key = access_key
          salutation = name.present? ? name : recipient
          params[:text] = self.text(recipient, access_key, groupname, ps, salutation, link_host, article_id)
          req.body = params
        end

        if response.status == 200
          log.write("#{t} Invite #{recipient}\n")
        else
          log.write("#{t} Invite #{recipient} failed:#{response.status}\n")
        end
      rescue Exception => e
        log.write("#{t} Invite error #{e}\n")
      end
    end

    def self.text(recipient, access_key, groupname, ps, salutation, link_host, article_id)
      if article_id
        self.email_article_text(recipient, access_key, groupname, ps, salutation, link_host)
      else
        self.email_text(recipient, access_key, groupname, ps, salutation, link_host)
      end
    end

    def self.email_text(recipient, access_key, groupname, ps, salutation, link_host)
        %Q{To: #{salutation},

This is an invitation to join the #{groupname} sphere, part of Spherical.

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

    def self.email_article_text(recipient, access_key, groupname, ps, salutation, link_host)
              %Q{To: #{salutation},

      This is an invitation to view an article and join the #{groupname} sphere, part of Spherical.

      If you wish to view the article and optionally accept the invitation, please click on the following link:
      <#{link_host}invite/accept/#{access_key}>

      Spherical is a private demo site.  By accepting this invitation you agree to abide by our terms of non-disclosure available at <https://spherical.io/nda>.

      If you don't wish to accept, you may still view the article.

      #{ps}

      -----------------------------------------------------------
      This invitation was sent to #{recipient}.
      If you do not wish to accept, you may just ignore it.
      If you do not wish to receive any more invitations like this,
      please click on the following link:
      <#{link_host}invite/opt_out/#{access_key}>}
    end
end
