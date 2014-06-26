Exec {
  path => "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
}
stage { 'preinstall':
  before => Stage['first']
}
class apt_get_update {
  exec { 'apt-get -y update': 
    ## unless apt-get has been run in the last 24 hours
    unless => 'test `find "/var/cache/apt/pkgcache.bin" -mmin -1440`',
  }
  
  exec { "gnupgdir":
    command => "/bin/mkdir -p /home/`whoami`/.gnupg",
    unless => 'test -d /home/`whoami`/.gnupg',
  }
}
class { 'apt_get_update':
  stage => preinstall
}
stage { 'first': 
    before => Stage['main'],
}
class essential_libs {
    package { [ 'build-essential',
                'libssl-dev',
                'libreadline-dev',
                'libxml2-dev',
                'libxslt1-dev',
                'sqlite3',
                'libsqlite3-dev',
                'libpcre3-dev',
                'libcurl4-openssl-dev',
                'libncurses5-dev',
                'git' ]:
        ensure => installed,
    }
}
class { 'essential_libs':
  stage => first
}

class make_src_dir {
    file { '/usr/local/src':
        ensure => directory,
    }
}
class { 'make_src_dir':
  stage => first
}

class make_topical_dir {
    file { ['/var/www', '/var/www/topical']:
        ensure => directory,
        mode => 755,
        owner => victor,
        group => victor,
    }
}
class { 'make_topical_dir':
  stage => first
}

include sshd
include fail2ban
include ufw
ufw::allow { "allow-ssh-from-all":
    port => 22,
}
ufw::allow { "allow-ssh-from-outside":
    port => 22,
    ip => $::ipaddress_eth1,
}
ufw::limit { 22: }
ufw::allow { "allow-http-from-all":
    port => 80,
    ip => $::ipaddress_eth1,
}
ufw::allow { "allow-https-from-all":
    port => 443,
    ip => $::ipaddress_eth1,
}

include mongodb
include essential_apps
include nginx_ppa

rbenv::install { "victor":
  group => 'victor',
  home  => '/home/victor'
} ->
rbenv::compile { "1.9.3-p484":
  user => "victor",
  home => "/home/victor",
  global => true,
} ->
exec { "norirdoc":
    command => "echo 'gem: --no-ri --no-rdoc' > /home/victor/.gemrc",
    creates => "/home/victor/.gemrc",
} ->
rbenv::gem { "foreman":
    user => "victor",
    ruby => "1.9.3-p484",
}

include thin