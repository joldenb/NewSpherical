class SettingsList
  include Mongoid::Document
  embedded_in :entity
  
  field :primary_image_src, :type => String
  
end