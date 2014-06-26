class PwdResetNotifier < ActionMailer::Base
  include Resque::Mailer
  def reset_password(email, reset_key)
    @email = email
    @reset_key = reset_key
    @link_host = ENV['FULLHOST']
    rtnadd = %Q{admin@topical.planetwork.net}
    mail  :to => email, 
          :subject => "Topical Password Reset.", 
          :from => rtnadd, 
          :reply_to => rtnadd
  end
end