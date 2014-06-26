class Item
    include Mongoid::Document
    include Mongoid::Timestamps

    has_many :item_contexts
    has_many :item_elevators

    embeds_many :comments
    
    field :item_type, :type => String
    field :oid, :type => String
    field :headline, :type => String
    field :text, :type => String
    field :image_src, :type => String
    field :image_width, :type => Integer
    field :image_height, :type => Integer
    field :article_uri, :type => String
    field :source_uri, :type => String
    field :source_name, :type => String
    field :media_link, :type => String
    field :media_link2, :type => String
    field :timestamp, :type => Integer
    field :sort_order, :type => Integer
    field :submitter, :type => Moped::BSON::ObjectId

    index({:name => 1})
    index({:oid => 1}, {:unique => true})
    index({:sort_order => -1})
    
    validates_uniqueness_of :oid
    validates_inclusion_of :item_type, in: ItemTypes

    def pretty_timestamp
        t = Time.at(self.timestamp)
        t.strftime("%B #{t.day.ordinalize}, %Y")
    end
end