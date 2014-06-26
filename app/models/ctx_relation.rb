class CtxRelation
    include Mongoid::Document
    include Mongoid::Timestamps::Created::Short

    field :related_to, :type => Moped::BSON::ObjectId

    belongs_to :context

    index({:related_to => 1})

end