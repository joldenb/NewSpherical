class Comment
  include Mongoid::Document
  include Mongoid::Timestamps::Short
  embedded_in :item
  
  field :author, :type => String
  field :text, :type => String
  
end