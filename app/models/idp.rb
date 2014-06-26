class Idp
  include Mongoid::Document
  include Mongoid::Timestamps
  embedded_in :entity
  
  field :provider, :type => String
  field :uid, :type => String
  field :nym, :type => String
  field :name, :type => String
  field :image, :type => String
  
end