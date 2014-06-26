class essential_apps {
    package { [ 'nodejs', 
                'redis-server', 
                'postfix', 
                'php5-common', 
                'php5-cli', 
                'php5-fpm',
                'imagemagick']:
        ensure => installed,
    }
}


         