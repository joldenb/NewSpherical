class ItemContext
    include Mongoid::Document
    include Mongoid::Timestamps::Updated::Short

    field :sort_order, :type => Integer, :default => 0
    field :elevation, :type => Integer, :default => 0
    field :item_type, :type => String

    belongs_to :item
    belongs_to :context

    index({item_id: 1, :elevation => -1, sort_order: -1})
    index({context_id: 1, :item_type => 1, :elevation => -1, sort_order: -1})
    index({:u_at => -1})
    
end