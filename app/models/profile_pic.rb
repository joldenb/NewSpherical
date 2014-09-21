class ProfilePic
  include Mongoid::Document
  belongs_to :entity

  mount_uploader :pic, ProfilePicUploader

end
