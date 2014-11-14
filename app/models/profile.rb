class Profile
  include Mongoid::Document
  include Mongoid::Timestamps
  embedded_in :entity

  field :profiletxt, :type => String
  field :context, :type => Moped::BSON::ObjectId
  field :is_default, :type => Boolean, :default => true
  field :admin_generated, :type => Boolean, :default => false

  validates_presence_of :profiletxt
  validates_presence_of :context

end
