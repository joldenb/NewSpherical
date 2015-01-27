class ResourceFile
  include Mongoid::Document
  belongs_to :item

  mount_uploader :rfile, ResourceFileUploader

  field :filename, :type => String

end
