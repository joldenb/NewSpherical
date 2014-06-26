class Invitee
  include Mongoid::Document
  include Mongoid::Timestamps
  
  belongs_to :context, :index => true
  
  field :inviter, :type => String
  field :email, :type => String
  field :invitee_name, :type => String
  field :access_key, :type => String
  field :sent_at, :type => DateTime
  field :accepted, :type => Boolean, :default => false
  field :accepted_user, :type => Moped::BSON::ObjectId
  field :opted_out, :type => Boolean, :default => false
  field :globally_opted_out, :type => Boolean, :default => false
  field :resent_at, :type => Array
  field :on_resend_queue, :type => Boolean, :default => false
  field :invited_role, :type => String, :default => "participant"
  field :view_article, :type => String
  
  index({:email => 1})
  index({:access_key => 1}, {:unique => true})
  
  #validates_format_of :email, with: MCX::EmailRgx
  validates_presence_of :access_key
  
  def last_sent_at
    (self.resent_at && !self.resent_at.empty?) ? self.resent_at.last : self.sent_at
  end
  
  def has_globally_opted_out?
    !!Invitee.where(:email => self.email, :globally_opted_out => true).first
  end
end