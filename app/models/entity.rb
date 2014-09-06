class Entity
  include Mongoid::Document
  include Mongoid::Timestamps
  include ActiveModel::SecurePassword
  has_secure_password

  mount_uploader :profile_pic, ProfilePicUploader

  field :email, :type => String
  field :screen_name, :type => String, :default => ""
  field :handle, :type => String
  field :password_digest, :type => String, :default => ""
  field :local_login, :type => Boolean, :default => true
  field :entity_type, :type => String
  field :remember_me_token, :type => String
  field :suspended, :type => Boolean, :default => false


  validates_presence_of :email
  validates_uniqueness_of :email, :message => " already in use."
  validates_format_of :email, :with => REmailRegex
  validates_presence_of :handle
  validates_format_of :handle, :with => RHandleRegex, :message => " may only contain letters/numbers/dashes.", :allow_blank => true
  validates_uniqueness_of :handle
  validates_inclusion_of :entity_type, in: ["Individual", "Institutional"]

  embeds_many :idps
  embeds_many :roles
  embeds_one :settings_list
  has_many :entity_contexts
  has_many :item_elevators

  index({:email => 1}, {:unique => true})
  index({:handle => 1}, {:unique => true, :sparse => true})
  index({:remember_me_token => 1}, {:unique => true, :sparse => true})
  index({:screen_name => 1})
  index({"idp.uid" => 1, "idp.provider" => 1})
  index({"role.context" => 1})


  def profile_image
    if !self.profile_pic.thumb.url.nil?
      ENV['FULLHOST'] + self.profile_pic.thumb.url
    else
      return nil if self.idps.empty? && self.settings_list.nil?
      if img_src = get_setting_for(:primary_image_src)
        provider_list = [img_src]
      else
        provider_list = %w{twitter facebook linkedin}
      end

      provider_list.each do |provider|
        if pvdr = self.idps.where(:provider => provider).first
          return pvdr.image if pvdr.image.present?
        end
      end
      nil
    end
  end

  def get_setting_for(fld)
    return nil unless self.settings_list
    return nil unless self.settings_list.respond_to?(fld.to_sym)
    self.settings_list.send(fld.to_sym)
  end
end
