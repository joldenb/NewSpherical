class nginx_ppa {
        
    exec { "nginx-apt-key":
        command => "/usr/bin/apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv C300EE8C",
        unless  => "/usr/bin/apt-key list|/bin/grep -c 'Launchpad Stable'",
    }
    
    #from https://launchpad.net/~nginx/+archive/stable
    exec { "get-nginx-sources":
        command => "/bin/echo 'deb http://ppa.launchpad.net/nginx/stable/ubuntu precise main' | /usr/bin/tee /etc/apt/sources.list.d/nginxppa.list && /usr/bin/apt-get update",
        creates  =>  "/etc/apt/sources.list.d/nginxppa.list",
        require => Exec['nginx-apt-key'],
    }
    
    package { 'nginx':
        ensure => installed,
        require => Exec['get-nginx-sources'],
    }
    
    file { '/etc/nginx/htpwds':
        ensure => directory,
        mode => 755,
        owner => root,
        group => root,
        require => Package['nginx'],
    }
    file { '/etc/nginx/nginx.conf':
        require  => File['/etc/nginx/htpwds'],
        mode => 644,
        owner => root,
        group => root,
        source => "puppet:///modules/nginx_ppa/nginx.conf",
    }
    file { '/etc/nginx/htpwds/.htpasswd-cooling':
        require  => File['/etc/nginx/nginx.conf'],
        mode => 644,
        owner => root,
        group => root,
        source => "puppet:///modules/nginx_ppa/htpwds/.htpasswd-cooling",
    }
    file { '/etc/nginx/sites-available':
        require  => File['/etc/nginx/htpwds/.htpasswd-cooling'],
        mode => 644,
        owner => root,
        group => root,
        source => "puppet:///modules/nginx_ppa/sites-available",
        recurse => true,
    }
    file { '/etc/nginx/ssl':
        require  => File['/etc/nginx/sites-available'],
        before => Exec['keyperms'],
        mode => 644,
        owner => root,
        group => root,
        source => "puppet:///modules/nginx_ppa/ssl",
        recurse => true,
    }
    exec {'keyperms':
        command => "/bin/chmod 400 /etc/nginx/ssl/*.key",
    }

}