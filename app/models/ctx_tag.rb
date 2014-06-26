class CtxTag
    include Mongoid::Document
    include Mongoid::Timestamps::Created::Short

    field :tagstring, :type => String

    belongs_to :context

    index({:tagstring => 1})

end