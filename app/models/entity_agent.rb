class EntityAgent
    class ContextError < StandardError; end
    class ParamsError < StandardError; end
    class ConflictError < StandardError; end

    def initialize(context, params={})
        if context.kind_of?(String)
            @context = context
        elsif  context.kind_of?(Array) && context.all? {|s| s.kind_of?(String)}
            @contexts = context
        else
            raise ContextError, "Parent_contexts arg must be a string or an array of strings."
        end
        @params = params.kind_of?(Struct) ? Hash[params.each_pair.to_a] : params
        @role = @params.delete(:role) || "participant"
    end

    def create_or_update_individual
        raise ParamsError, "entity must have handle" unless handle = @params.delete(:handle)
        handle = handle.to_s.downcase
        raise ParamsError, "handle may only contain letters, numbers and dashes" unless handle =~ RHandleRegex
        entity_type = "Individual"

        if entity = Entity.where(:handle => handle, :entity_type => "Individual").first
            entity.update_attributes(@params)
            new_entity = false
        else
            entity = Entity.create(@params.merge(:handle => handle, :entity_type => "Individual"))
            new_entity = true
        end

        if entity.valid?
            if @context
                if ctx = Context.find_by(:identifier => @context)
                    #updates sort order only if is a new entity
                    EntityAgent.add_or_update_entity_context(entity, ctx, new_entity)
                    EntityAgent.add_role_in_context(entity.id, ctx.id, @role)
                else
                    entity.destroy if new_entity
                    raise ContextError, "Context #{@context} cannot be found."
                end
            else
                @contexts.each do |context|
                    if ctx = Context.find_by(:identifier => context)
                        EntityAgent.add_or_update_entity_context(entity, ctx, new_entity)
                        EntityAgent.add_role_in_context(entity.id, ctx.id, @role)
                    else
                        entity.destroy if new_entity
                        raise ContextError, "Context #{context} cannot be found."
                    end
                end
            end

            if new_entity && entity.valid?
                new_pcontext = ContextAgent.new(:creator => entity.id).create_new_personal_context
            end
        end

        if new_pcontext && !new_pcontext.valid?
            raise ParamsError, new_pcontext.errors.full_messages.join(', ')
        end
        if new_entity && entity.valid? && !new_pcontext
            raise ParamsError, "Could not create Personal Channel."
        end
        if entity.valid?
            entity
        else
            raise ParamsError, entity.errors.full_messages.join(', ')
        end
    end

    def create_individual_with_social_login
        raise ParamsError, "entity must have handle" unless handle = @params.delete(:handle)
        handle = handle.to_s.downcase
        raise ParamsError, "handle may only contain letters, numbers and dashes" unless handle =~ RHandleRegex
        entity_type = "Individual"
        raise ParamsError, "Missing oauth data" unless oauth_data = @params.delete(:oauth_data)
        oadata = EntityAgent.filtered_oauth_data(oauth_data)

        if Entity.where(:handle => handle).first
            raise ConflictError, "Entity already exists."
        else
            entity = Entity.create(@params.merge(:handle => handle, :entity_type => "Individual"))
            begin
                idp = Idp.new(oadata)
                entity.idps << idp
            rescue Exception => e
                raise ParamsError, "Oauth data incorrect."
            end

        end

        if entity.valid?
            if @context
                if ctx = Context.find_by(:identifier => @context)
                    EntityAgent.add_or_update_entity_context(entity, ctx)
                    EntityAgent.add_role_in_context(entity.id, ctx.id, @role)
                else
                    entity.destroy
                    raise ContextError, "Context #{@context} cannot be found."
                end
            else
                @contexts.each do |context|
                    if ctx = Context.find_by(:identifier => context)
                        EntityAgent.add_or_update_entity_context(entity, ctx)
                        EntityAgent.add_role_in_context(entity.id, ctx.id, @role)
                    else
                        entity.destroy
                        raise ContextError, "Context #{context} cannot be found."
                    end
                end
            end

            new_pcontext = ContextAgent.new(:creator => entity.id).create_new_personal_context
        end

        if entity.valid?
            if new_pcontext.valid?
                entity
            else
                raise ParamsError, new_pcontext.errors.full_messages.join(', ')
            end
        else
            raise ParamsError, entity.errors.full_messages.join(', ')
        end
    end

    ## class methods
    class << self
        def get_entities(context, options={})
            #sort_order = options[:sort_order] || 'desc'
            page = options[:page] || 0
            limit = options[:limit] || EntityCarouselPerPage

            raise ContextError, "Not a valid context." unless context.kind_of?(Context)
            ent_ids = context.entity_contexts.map{|ec| ec.entity_id}.compact
            Entity.where(:id.in => ent_ids).order_by(:handle => 'asc').skip(page).limit(limit).to_ary
        end

        def get_curators(context, options={})
            sort_order = options[:sort_order] || 'desc'
            page = options[:page] || 0
            limit = options[:limit] || EntityCarouselPerPage

            raise ContextError, "Not a valid context." unless context.kind_of?(Context)
            ent_ids = context.entity_contexts.map{|ec| ec.entity_id}.compact
            Entity.where(:id.in => ent_ids).and(:'roles.role'.in => %w{admin founder curator}).order_by(:handle => 'asc').skip(page).limit(limit).to_ary
        end

        def add_idp_to_entity(handle, oauth_data)
            oadata = EntityAgent.filtered_oauth_data(oauth_data)
            if entity = Entity.where(:handle => handle).first
                unless entity.idps.where(:provider => oadata[:provider]).first
                    entity.idps << Idp.new(oadata)
                else
                    raise ParamsError, "IDP already exists."
                end
            else
                raise ParamsError, "Cannot find entity."
            end
        end

        def add_entity_to_ctx(entity_id, ctx)
            unless entity_id.instance_of?(String) || entity_id.instance_of?(Moped::BSON::ObjectId)
                raise ParamsError, "Invalid EntityID"
            end
            if ctx.instance_of?(Context)
                context_id = ctx.id
            elsif ctx.instance_of?(String) || ctx.instance_of?(Moped::BSON::ObjectId)
                context_id = ctx
            else
                raise ParamsError, "Invalid Context"
            end
            entctx = EntityContext.find_or_create_by(:entity_id => entity_id, :context_id => context_id)
            if entctx.valid?
                if entctx.sort_order.zero?
                    entctx.update_attributes(:sort_order => TopicalUtils.microtime2int(Time.now))
                end
            else
                raise ConflictError, "Can't find or create EntityContext"
            end

            entctx.id
        end

        def destroy_entity(handle)
            if entity = Entity.where(:handle => handle).first
                if mychan = EntityAgent.get_my_channel(entity.id)
                    mychan.destroy
                end
                entity.entity_contexts.each {|ectx| ectx.destroy}
                entity.item_elevators.each {|eie| eie.destroy}
                entity.destroy
            end
        end

        def add_or_update_entity_context(entity, context, update_sort_order=false)
            new_sort_order = TopicalUtils.microtime2int(Time.now)
            if entity_ctx = EntityContext.where(:entity_id => entity.id, :context_id => context.id).first
                entity_ctx.update_attributes(:sort_order => new_sort_order) if update_sort_order
            else
                entity_ctx = EntityContext.create(:sort_order => new_sort_order)
                context.entity_contexts << entity_ctx
                entity.entity_contexts << entity_ctx
            end
        end

        def add_role_in_context(entity_id, context_id, role)
            unless entity_id.to_s =~ RMongoIdRegex && context_id.to_s =~ RMongoIdRegex
                raise ParamsError, "Bad entity or context id"
            end
            unless %w{admin founder curator participant mychannel demo}.include?(role)
                raise ParamsError, "Unknown role"
            end
            if entity = Entity.find(entity_id)
                !!entity.roles.find_or_create_by(:context => context_id, :role => role)
            else
                raise ParamsError, "Unknown entity"
            end
        end

        def update_password(entity_id, pwd, pwdconf)
            unless entity_id.to_s =~ RMongoIdRegex
                raise ParamsError, "Bad entity id"
            end
            if entity = Entity.find(entity_id)
                entity.with(:safe => true).update_attributes(:password => pwd, :password_confirmation => pwdconf)
                if entity.valid?
                    "Updated password"
                else
                    entity.errors.full_messages.join(', ')
                end
            end
        end

        def get_my_channel(entity_id)
            unless entity_id.to_s =~ RMongoIdRegex
                raise ParamsError, "Bad entity id"
            end
            if entity = Entity.find(entity_id)
                Context.find_by(:identifier => entity.id)
            else
                raise ParamsError, "Cannot find entity"
            end
        end

        def filtered_oauth_data(data)
            unless data.kind_of?(Hash) && data[:uid].present? && data[:provider].present?
                raise ParamsError, "Missing oauth params"
            end
            {:uid => data[:uid],
             :provider => data[:provider],
             :nym => data[:nym],
             :name => data[:name],
             :image => data[:image]}
        end

        def unique_screen_name(screenname, entity_id=nil)
          if entity_id
            unless entity_id.to_s =~ RMongoIdRegex
                raise ParamsError, "Bad entity id"
            end
            unless entity = Entity.find(entity_id)
              raise ParamsError, "Cannot find entity"
            end

            if sn = Entity.find_by(:screen_name => /^#{screenname}$/i)
              if sn.id != entity.id
                return false
              end
            end
            if hnd = Entity.find_by(:handle => /^#{screenname}$/i)
              if hnd.id != entity.id
                return false
              end
            end

            ## returned false if screen name or handle is already in use
            ## by someone other than this entity, otherwise:
            true
          else
            if sn = Entity.find_by(:screen_name => /^#{screenname}$/i)
              return false
            end
            if hnd = Entity.find_by(:handle => /^#{screenname}$/i)
              return false
            end

            ## returned false if screen name or handle is already in use, otherwise:
            true
          end
        end

        def unique_email(email, entity_id=nil)
          if REmailRegex !~ email
            raise ParamsError, "Incorrect email format"
          end
          if entity_id
            unless entity_id.to_s =~ RMongoIdRegex
                raise ParamsError, "Bad entity id"
            end
            unless entity = Entity.find(entity_id)
              raise ParamsError, "Cannot find entity"
            end
            if ent = Entity.find_by(:email => email)
              if ent.id != entity.id
                return false
              end
            end
            ## returned false if email is already in use
            ## by someone other than this entity, otherwise:
            true
          else
            if ent = Entity.find_by(:email => email)
              return false
            end
            ## returned false if email is already in use, otherwise:
            true
          end
        end
    end
end
