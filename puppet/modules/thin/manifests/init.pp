class thin {
    rbenv::gem { "thin":
        user => "victor",
        ruby => "1.9.3-p484",
        before => Exec['thinservice'],
    }
    
    exec { "thinservice":
        cwd => "/home/victor",
        command => "/home/victor/.rbenv/shims/ruby /home/victor/.rbenv/versions/1.9.3-p484/bin/thin install && /usr/sbin/update-rc.d -f thin defaults",
        creates => "/etc/init.d/thin",
    }
    
    file { '/etc/thin/topical.yml':
        require  => Exec["thinservice"],
        mode => 644,
        owner => victor,
        group => victor,
        source => "puppet:///modules/thin/topical.yml",
    }
    
}