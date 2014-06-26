class ItemElevator
    include Mongoid::Document
    include Mongoid::Timestamps::Created::Short

    field :elevation, :type => Integer, :default => 0

    belongs_to :context
    belongs_to :item
    belongs_to :entity

    index({:item_id =>  1, :entity_id => 1, :context_id => 1})
    index({:c_at => -1})

end