class sshd {
    service { 'ssh':
        ensure => running,
    }
    
    file { '/etc/ssh/sshd_config':
        notify  => Service["ssh"],
        mode => 644,
        owner => root,
        group => root,
        source => "puppet:///modules/sshd/sshd_config",
    }
}