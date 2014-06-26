class InviteeNotifier < ActionMailer::Base
  include Resque::Mailer
  def invite_participant(email, access_key, groupname, text, sig, name=nil)
    @email = email
    @access_key = access_key
    @groupname = groupname
    @name = name
    @salutation = name.present? ? name : email
    @text = text
    @sig = sig
    @link_host = ENV['FULLHOST']
    rtnadd = %Q{admin@topical.planetwork.net}
    mail  :to => email, 
          :subject => "Invitation to join the #{groupname} Topical group.", 
          :from => rtnadd, 
          :reply_to => rtnadd
  end
end