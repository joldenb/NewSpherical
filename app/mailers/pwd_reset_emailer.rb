class PwdResetEmailer
    @queue = :mailgun
    def self.perform(recipient, reset_key)
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
          params[:from] = "admin@topical.planetwork.net"
          params[:reply_to] = "admin@topical.planetwork.net"
          params[:subject] = "Topical Password Reset"
          link_host = ENV['FULLHOST']
          reset_key = reset_key
          params[:text] = self.email_text(recipient, link_host, reset_key)
          req.body = params
        end

        if response.status == 200
          log.write("#{t} PwdRst #{recipient}\n")
        else
          log.write("#{t}  PwdRst #{recipient} failed:#{response.status}\n")
        end
      rescue Exception => e
        log.write("#{t}  PwdRst #{e}\n")
      end
    end

    def self.email_text(email, link_host, reset_key)
        %Q{To: #{email},

We have received a request to allow you to reset your password.
If you wish to do so, please click on the following link:
<#{link_host}entity/reset_pwd/#{reset_key}>

If this was sent in error, you may just ignore this email.
The reset link will become invalid in 15 minutes.

Regards,
The Topical Admins}
    end
end