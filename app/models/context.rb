class Context
    include Mongoid::Document
    include Mongoid::Timestamps

    has_and_belongs_to_many :contexts, inverse_of: nil

    has_many :item_contexts
    has_many :entity_contexts
    has_many :item_elevators
    has_many :invitees
    has_many :ctx_tags
    has_many :ctx_relations
    has_many :forum_messages

    embeds_one :ctx_settings_list
    embeds_one :channel_info

    field :identifier, :type => String
    field :context_types, :type => Array
    field :display_name, :type => String
    field :description, :type => String
    field :sort_order, :type => Integer, :default => 0
    field :dashboard_url, :type => String

    index({:identifier => 1}, {:unique => true})
    index({:display_name => 1}, {:unique => true, :sparse => true})
    index({:context_types => 1})
    index({"channel_info.ip_addresses" => 1})
    index({"channel_info.allowed_rdr_hosts" => 1}, {:unique => true, :sparse => true})

    validates_uniqueness_of :identifier, :case_sensitive => false
    validates_format_of :identifier, :with => RContextRegex, :message => " may only contain letters/numbers/dashes."
    validates_uniqueness_of :display_name, :case_sensitive => false, :allow_nil => true

    def display_identifier
        if self.context_types.include?("My Channel")
            "My Channel"
        else
            self.display_name ? self.display_name : self.identifier.humanize.titleize
        end
    end
end
