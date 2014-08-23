class ForumMessage
    include Mongoid::Document
    include Mongoid::Timestamps::Created::Short

    field :author_id, :type => Moped::BSON::ObjectId
    field :message, :type => String

    belongs_to :context
    belongs_to :item

    index({:item_id =>  1, :author_id => 1})
    index({:c_at => -1})

end
