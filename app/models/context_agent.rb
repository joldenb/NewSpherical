class ContextAgent
    class ContextError < StandardError; end
    class ParamsError < StandardError; end

    attr_reader :context, :parent_context
    def initialize(params={})
        @params = params
        if @params[:context]
            @context = get_context_by_handle_or_id(@params[:context])
        end
        if @params[:parent_context]
            @parent_context = get_context_by_handle_or_id(@params[:parent_context])
        end
    end

    def create_new_subcontext
        raise ParamsError, "Malformed or missing identifier" unless @params[:identifier] =~ RContextRegex
        context_types = [@params[:context_types]].flatten || ["Public Topic"]
        begin
            if new_subcontext = Context.with(:safe => true).create(:identifier => @params[:identifier],
                                                                :display_name => @params[:display_name],
                                                                :context_types => context_types)
                new_subcontext.ctx_settings_list = CtxSettingsList.new
                if @parent_context
                    @parent_context.contexts << new_subcontext
                end
            else
                raise ContextError, new_subcontext.errors.full_messages.join(', ')
            end
        rescue Exception => e
            if /E11000/ =~ e.message
                raise ContextError, "Identifier is already taken"
            else
                raise ContextError, e.message
            end
        end

        new_subcontext
    end

    def create_new_public_topic
        raise ParamsError, "TopicalTopic instance required" unless @params[:topic].instance_of?(TopicalTopic::Topic)
        raise ParamsError, "Creator ID required" unless @params[:creator].to_s =~ RMongoIdRegex
        topic = @params[:topic]
        if new_topic = Context.with(:safe => true).create(:identifier => topic.identifier,
                                                            :display_name => topic.display_name,
                                                            :description => topic.desc,
                                                            :context_types => ["Public Topic"])
            topic.tags.each do |t|
                tag = Tag.find_or_create_by(:tagstring => t)
                new_topic.ctx_tags << CtxTag.new(:tagstring => tag.tagstring)
                tag.inc(:used_count, 1)
            end
            new_topic.create_ctx_settings_list(:visibility => topic.vis)
            unless new_topic.ctx_settings_list.valid?
                new_topic.create_ctx_settings_list
            end

            if creator = Entity.find(@params[:creator])
                EntityAgent.add_entity_to_ctx(creator.id, new_topic.id)
                EntityAgent.add_role_in_context(creator.id, new_topic.id, "admin")
                ContextAgent.new(:entity_id => creator.id, :relations => [new_topic.id]).add_mychannel_relations
            else
                raise ParamsError, "Unable to find creator"
            end
            new_topic
        else
            raise ContextError, new_topic.errors.full_messages.join(', ')
        end
    end

    def create_new_personal_context
        raise ParamsError, "Creator ID required" unless @params[:creator].to_s =~ RMongoIdRegex
        if creator = Entity.find(@params[:creator])
            if new_pcontext = Context.with(:safe => true).create(:identifier => creator.id.to_s,
                                                                :context_types => ["My Channel"])
            EntityAgent.add_entity_to_ctx(creator.id, new_pcontext.id)
            EntityAgent.add_role_in_context(creator.id, new_pcontext.id, "mychannel")
            else
                raise ContextError, new_pcontext.errors.full_messages.join(', ')
            end
        else
            raise ParamsError, "Unable to find creator"
        end
        new_pcontext
    end

    def update_topic
        raise ParamsError, "Context required" unless @context.instance_of?(Context)
        raise ParamsError, "TopicalTopic instance required" unless @params[:topic_data].instance_of?(TopicalTopic::Topic)
        topic_data = @params[:topic_data]
        if @context.update_attributes(:display_name => topic_data.display_name, :description => topic_data.desc)
            if topic_data.tags.kind_of?(Array)
                #remove tags that are not in the updated list
                @context.ctx_tags.each do |cxtg|
                    unless topic_data.tags.include?(cxtg.tagstring)
                        remove_tag(cxtg.tagstring)
                    end
                end
                #add tags that are in the updated list
                topic_data.tags.each do |t|
                    add_tag(t)
                end
            end
            @context.ctx_settings_list.update_attributes(:visibility => topic_data.vis)
            @context
        else
            raise ContextError, @context.errors.full_messages.join(', ')
        end
    end

    def destroy_context
        ctx = get_context_by_handle_or_id(@params[:context])
        ctx.ctx_tags.each do |tag|
            Tag.where(:tagstring => tag.tagstring).first.inc(:used_count, -1)
        end
        CtxTag.where(:context_id => ctx.id).destroy_all
        ItemContext.where(:context_id => ctx.id).destroy_all
        EntityContext.where(:context_id => ctx.id).destroy_all
        ItemElevator.where(:context_id => ctx.id).destroy_all
        Invitee.where(:context_id => ctx.id).destroy_all
        Context.where(:context_ids => ctx.id).each {|c| c.pull(:context_ids, ctx.id)}
        CtxRelation.where(:context_id => ctx.id).destroy_all
        Entity.where("roles.context" => ctx.id).each do |ent|
            ent.roles.each do |role|
                if role.context == ctx.id
                    role.destroy
                end
            end
        end
        ctx.destroy
    end

    def add_relations
        raise ContextError, "Valid context must be provided" unless @context
        unless @params[:relations].kind_of?(Array) && @params[:relations].all?{|r| r.to_s =~ RMongoIdRegex}
            raise ParamsError, ":relations must be an array of Context identifiers"
        end
        @params[:relations].each do |relation|
            unless @context.ctx_relations.find_by(:related_to => relation)
                @context.ctx_relations << CtxRelation.new(:related_to => relation)
            end
        end
    end

    def remove_relations
        raise ContextError, "Valid context must be provided" unless @context
        unless @params[:relations].kind_of?(Array) && @params[:relations].all?{|r| r.to_s =~ RMongoIdRegex}
            raise ParamsError, ":relations must be an array of Context identifiers"
        end
        @params[:relations].each do |relation|
            if r = @context.ctx_relations.find_by(:related_to => relation)
                r.destroy
            end
        end
    end

    def get_relations(srt=true)
        raise ContextError, "Valid context must be provided" unless @context
        relations = @context.ctx_relations.map {|r| Context.find(r.related_to)}.compact
        srt ? relations.sort{|a,b|a.identifier <=> b.identifier} : relations
    end

    def add_mychannel_relations
        raise ContextError, "Valid :entity_id must be provided" unless @params[:entity_id].to_s =~ RMongoIdRegex
        unless entity = Entity.find(@params[:entity_id])
            raise ContextError, "Valid entity not found"
        end
        unless mychannel = EntityAgent.get_my_channel(entity.id)
            raise ContextError, "My Channel not found"
        end
        unless @params[:relations].kind_of?(Array) && @params[:relations].all?{|r| r.to_s =~ RMongoIdRegex}
            raise ParamsError, ":relations must be an array of Context identifiers"
        end
        @params[:relations].each do |relation|
            unless mychannel.ctx_relations.find_by(:related_to => relation)
                mychannel.ctx_relations << CtxRelation.new(:related_to => relation)
            end
        end
    end

    def remove_mychannel_relations
        raise ContextError, "Valid :entity_id must be provided" unless @params[:entity_id].to_s =~ RMongoIdRegex
        unless entity = Entity.find(@params[:entity_id])
            raise ContextError, "Valid entity not found"
        end
        unless mychannel = EntityAgent.get_my_channel(entity.id)
            raise ContextError, "My Channel not found"
        end
        unless @params[:relations].kind_of?(Array) && @params[:relations].all?{|r| r.to_s =~ RMongoIdRegex}
            raise ParamsError, ":relations must be an array of Context identifiers"
        end
        @params[:relations].each do |relation|
            if r = mychannel.ctx_relations.find_by(:related_to => relation)
                r.destroy
            end
        end
    end


    private
    def add_tag(tagstr)
        raise ParamsError, "Context required" unless @context.instance_of?(Context)
        tag = Tag.find_or_create_by(:tagstring => tagstr)
        unless @context.ctx_tags.find_by(:tagstring => tag.tagstring)
            @context.ctx_tags << CtxTag.new(:tagstring => tag.tagstring)
            tag.inc(:used_count, 1)
        end
    end

    def remove_tag(tagstr)
        raise ParamsError, "Context required" unless @context.instance_of?(Context)
        if ctstr = @context.ctx_tags.find_by(:tagstring => tagstr)
            ctstr.destroy
            if tag = Tag.find_by(:tagstring => tagstr)
                tag.inc(:used_count, -1)
            end
        end
    end

    def get_context_by_handle_or_id(ctx)
        if ctx.kind_of?(Moped::BSON::ObjectId) || ctx.kind_of?(String)
            if ctx.to_s =~ RMongoIdRegex
                if context = Context.find(ctx)
                    context
                else
                    raise ContextError, "Unknown context id."
                end
            elsif ctx =~ RContextRegex
                if context = Context.where(:identifier => ctx).first
                    context
                else
                    raise ContextError, "Unknown context identifier."
                end
            else
                raise ParamsError, "Arg must be Context, id or identifier."
            end
        else
            if ctx && ctx.instance_of?(Context)
                ctx
            else
                raise ParamsError, "Arg must be Context, id or identifier." 
            end
        end
    end
end