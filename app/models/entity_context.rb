class EntityContext
    include Mongoid::Document

    field :sort_order, :type => Integer, :default => 0

    belongs_to :entity
    belongs_to :context

    index({entity_id: 1, sort_order: -1})
    index({context_id: 1, sort_order: -1})
end