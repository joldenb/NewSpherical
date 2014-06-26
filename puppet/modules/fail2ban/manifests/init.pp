class fail2ban {
    package { 'fail2ban':
        ensure => installed,
    }
    
    service { 'fail2ban':
        ensure => running,
        require => Package['fail2ban'],
    }
    
    exec { 'config-fail2ban':
        command => 'cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local',
        creates => '/etc/fail2ban/jail.local',
        require => Package['fail2ban'],
        notify => Service['fail2ban'],
    }
}