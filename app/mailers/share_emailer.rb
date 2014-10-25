class ShareEmailer
    @queue = :mailgun
    def self.perform(inviteparams)
      logfile = "#{Rails.root}/log/mailgun.log"
      log = File.new(logfile, 'a')
      log.sync = true
      t = Time.now.strftime("%F at %T")

      current_user = inviteparams[:current_user]
      recipient = inviteparams[:recipient]
      sphere = inviteparams[:sphere]
      ps = inviteparams[:ps]
      headline = inviteparams[:headline]
      current_user_email = inviteparams[:current_user_email]
      current_user_screename = inviteparams[:current_user_screename]
      share_url = inviteparams[:share_url]

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
          params[:subject] = "Spherical invitation"
          link_host = ENV['FULLHOST']
          params[:text] = self.text(current_user_screename, recipient, share_url, headline, ps, sphere, link_host)
          req.body = params
        end

        if response.status == 200
          log.write("#{t} Share #{recipient}\n")
        else
          log.write("#{t} Share #{recipient} failed:#{response.status}\n")
        end
      rescue Exception => e
        log.write("#{t} Share error #{e}\n")
      end
    end

    def self.text(sender_name, recipient, share_url, headline, ps, sphere, link_host)
      %Q{To: #{recipient},

#{sender_name} would like to share the following item on the #{sphere} sphere with you:

#{headline}
#{share_url}

P.S. #{ps}

-----------------------------------------------------------
This invitation was sent to #{recipient}.
If you do not wish to accept, you may just ignore it.}
    end

end
