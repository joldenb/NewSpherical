class CtxSettingsList
  include Mongoid::Document
  embedded_in :context
  
  field :can_invite, :type => String, :default => "curator"
  field :visibility, :type => String, :default => "participants"

  validates_inclusion_of :can_invite, :in => %w{admin founder curator}
  validates_inclusion_of :visibility, :in => %w{all participants}
  
end