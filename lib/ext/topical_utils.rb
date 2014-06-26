module TopicalUtils
    extend self

    def microtime2int(t)
      #convert a Time object, e.g 'Time.now', expressed as microtime, to an integer
      (t.to_f * 1_000_000).to_i
    end

    def item_elevation_expiration
        # in hours
        72
    end
end
