class mongodb {
    
    exec { "mongo-apt-key":
        command => "/usr/bin/apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10",
        unless  => "/usr/bin/apt-key list|/bin/grep -c richard@10gen.com",
    }
    
    exec { "get-mongo-sources":
        command => "/bin/echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | /usr/bin/tee /etc/apt/sources.list.d/mongodb.list && /usr/bin/apt-get update",
        creates  =>  "/etc/apt/sources.list.d/mongodb.list",
        require => Exec['mongo-apt-key'],
    }
    
    package { 'mongodb-10gen':
        ensure => installed,
        require => Exec['get-mongo-sources'],
    }

}

