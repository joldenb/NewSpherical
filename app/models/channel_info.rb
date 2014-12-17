class ChannelInfo
  include Mongoid::Document
  embedded_in :context

  field :ip_addresses, :type => Array
  field :dashboard_logo, :type => String
  field :sphere_logo, :type => String
  field :dashboard_url, :type => String
  field :allowed_rdr_hosts, :type => Array

end
