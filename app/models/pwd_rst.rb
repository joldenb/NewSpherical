class PwdRst
    include Mongoid::Document
    include Mongoid::Timestamps::Short

    field :email, :type => String
    field :reset_key, :type => String
    field :req_ip, :type => String
    field :entity_id, :type => Moped::BSON::ObjectId
    field :active, :type => Boolean, :default => true

    index({:reset_key => 1}, {:unique => true})

    validates_uniqueness_of :reset_key
end