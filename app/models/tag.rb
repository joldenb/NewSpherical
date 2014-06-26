class Tag
    include Mongoid::Document
    include Mongoid::Timestamps::Short

    field :tagstring, :type => String
    field :used_count, :type => Integer, :default => 0

    index({:tagstring => 1}, {:unique => true})
    index({:used_count => -1})

    validates_uniqueness_of :tagstring, :case_sensitive => false
    validates_format_of :tagstring, :with => RContextRegex, :message => " may only contain letters/numbers/dashes."
end