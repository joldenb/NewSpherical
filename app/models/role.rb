class Role
  include Mongoid::Document
  include Mongoid::Timestamps
  embedded_in :entity
  
  field :role, :type => String
  field :context, :type => Moped::BSON::ObjectId

  validates_presence_of :role
  validates_presence_of :context
  
end