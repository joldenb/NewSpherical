class InviteeEmailer
    @queue = :mailgun
    def self.perform(sender, recipient, access_key, groupname, text, sig, article_id=nil, name=nil)
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
          req.url "/v2/topical.planetwork.net/messages"
          params[:to] = recipient
          if sender =~ EmailAddressesParser::DEFAULT_REGEX
            params[:from] = sender
            params[:reply_to] = sender
          else
            params[:from] = "admin@topical.planetwork.net"
            params[:reply_to] = "admin@topical.planetwork.net"
          end
          params[:subject] = "Topical Invitation"
          link_host = ENV['FULLHOST']
          access_key = access_key
          salutation = name.present? ? name : recipient
          params[:text] = self.text(recipient, access_key, groupname, text, sig, salutation, link_host, article_id)
          req.body = params
        end

        if response.status == 200
          log.write("#{t} Invite #{recipient}\n")
        else
          log.write("#{t} Invite #{recipient} failed:#{response.status}\n")
        end
      rescue Exception => e
        log.write("#{t} Invite #{e}\n")
      end
    end

    def self.text(recipient, access_key, groupname, text, sig, salutation, link_host, article_id)
      if article_id
        self.email_article_text(recipient, access_key, groupname, text, sig, salutation, link_host)
      else
        self.email_text(recipient, access_key, groupname, text, sig, salutation, link_host)
      end
    end

    def self.email_text(recipient, access_key, groupname, text, sig, salutation, link_host)
        %Q{To: #{salutation},

#{text}

If you wish to accept, please click on the following link:
<#{link_host}invite/accept/#{access_key}>

Topical is a private demo site.  By accepting this invitation you agree to abide by our terms of non-disclosure available at <https://topical.planetwork.net/nda>.

If you don't wish to accept, you may just ignore this email.

#{sig}

-----------------------------------------------------------
This invitation was sent to #{recipient}. 
If you do not wish to accept, you may just ignore it.
If you do not wish to receive any more invitations like this, 
please click on the following link:
<#{link_host}invite/opt_out/#{access_key}>}
    end

    def self.email_article_text(recipient, access_key, groupname, text, sig, salutation, link_host)
              %Q{To: #{salutation},

      #{text}

      If you wish to view the article and optionally accept the invitation, please click on the following link:
      <#{link_host}invite/accept/#{access_key}>

      Topical is a private demo site.  By accepting this invitation you agree to abide by our terms of non-disclosure available at <https://topical.planetwork.net/nda>.

      If you don't wish to accept, you may still view the article.

      #{sig}

      -----------------------------------------------------------
      This invitation was sent to #{recipient}. 
      If you do not wish to accept, you may just ignore it.
      If you do not wish to receive any more invitations like this, 
      please click on the following link:
      <#{link_host}invite/opt_out/#{access_key}>}
    end
end