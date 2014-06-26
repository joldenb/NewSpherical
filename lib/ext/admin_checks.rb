module AdminChecks
    def valid_admin(context_id, role_required=[])
      if session[:user_id]
        if u = Entity.find(session[:user_id])
          roles  = u.roles
          return false if roles.empty? || context_id.to_s !~ RMongoIdRegex
          if role_required.kind_of?(Array)
            role_required_plus_admin = ["admin", "founder"] | role_required
            result = false
            role_required_plus_admin.each {|r| result = true if roles.where(:role => r.to_s, :context => context_id).first}
            return result
          else
            !!roles.where(:role => role_required.to_s, :context => context_id).first
          end
        else
          false
        end
      else
        false
      end
    end

    def oauth_valid_admin(context_id, role_required=[], user_id=nil)
      if user_id
        if u = Entity.find(user_id)
          roles  = u.roles
          return false if roles.empty? || context_id.to_s !~ RMongoIdRegex
          if role_required.kind_of?(Array)
            role_required_plus_admin = ["admin", "founder"] | role_required
            result = false
            role_required_plus_admin.each {|r| result = true if roles.where(:role => r.to_s, :context => context_id).first}
            return result
          else
            !!roles.where(:role => role_required.to_s, :context => context_id).first
          end
        else
          false
        end
      else
        false
      end
    end

    def admin_in_any_ctx(role_required=[])
      if session[:user_id]
        role_required_plus_admin = ["admin", "founder"] | [role_required].flatten
        if u = Entity.find(session[:user_id])
          u.roles.map{|role| role.role}.any?{|r| role_required_plus_admin.include?(r)}
        else
          false
        end
      end
    end
end