class ItemAgent
    class ContextError < StandardError; end
    class ParamsError < StandardError; end
    class ItemError < StandardError; end

    def initialize(context, params={})
        if context.kind_of?(String)
            @context = context
        elsif  context.present? && context.kind_of?(Array) && context.all? {|s| s.kind_of?(String)}
            @contexts = context
        else
            raise ContextError, "Parent_contexts arg must be a string or an array of strings."
        end
        @params = params.kind_of?(Struct) ? Hash[params.each_pair.to_a] : params
    end

    def create_or_update_r88r_item
        raise ParamsError, "r88r item must have oid" unless oid = @params.delete(:oid)
        item_type = "r88r"

        if item = Item.where(:oid => oid, :item_type => "r88r").first
            item.update_attributes(@params)
        else
            item = Item.create(@params.merge(:oid => oid, :item_type => item_type))
        end

        if @context
            if tpc = Context.find_by(:identifier => @context)
                add_or_update_item_context(item, tpc, item_type)
            else
                item.destroy
                raise ContextError, "Context #{@context} cannot be found."
            end
        else
            @contexts.each do |context|
                if tpc = Context.find_by(:identifier => context)
                    add_or_update_item_context(item, tpc, item_type)
                else
                    item.destroy
                    raise ContextError, "Context #{context} cannot be found."
                end
            end
        end

        item
    end

    def create_or_update_linktv_item
        raise ParamsError, "linkTV item must have oid" unless oid = @params.delete(:oid)
        item_type = "linktv"

        if item = Item.where(:oid => oid, :item_type => "linktv").first
            item.update_attributes(@params)
        else
            item = Item.create(@params.merge(:oid => oid, :item_type => item_type))
        end

        if @context
            if tpc = Context.find_by(:identifier => @context)
                add_or_update_item_context(item, tpc, item_type)
            else
                item.destroy
                raise ContextError, "Context #{@context} cannot be found."
            end
        else
            @contexts.each do |context|
                if tpc = Context.find_by(:identifier => context)
                    add_or_update_item_context(item, tpc, item_type)
                else
                    item.destroy
                    raise ContextError, "Context #{context} cannot be found."
                end
            end
        end

        item
    end

    def create_or_update_feed_item(item_type, submitter=nil)
        raise ParamsError, "#{item_type} item must have oid" unless oid = @params.delete(:oid)

        if item = Item.where(:oid => oid, :item_type => item_type).first
            if item_type == "curator"
                unless submitter && submitter.to_s == item.submitter.to_s
                    raise ParamsError, "Edit not allowed."
                end
            end
            item.update_attributes(@params)
        else
            item = Item.create(@params.merge(:oid => oid, :item_type => item_type))
        end

        if @context
            if tpc = Context.find(@context)
                add_or_update_item_context(item, tpc, item_type)
            elsif tpc = Context.find_by(:identifier => @context)
                add_or_update_item_context(item, tpc, item_type)
            else
                item.destroy
                raise ContextError, "Context #{@context} cannot be found."
            end
        else
            @contexts.each do |context|
                if tpc = Context.find_by(:identifier => context)
                    add_or_update_item_context(item, tpc, item_type)
                else
                    item.destroy
                    raise ContextError, "Context #{context} cannot be found."
                end
            end
        end

        item
    end

    # def create_or_update_topical_item
    #     raise ParamsError, "Topical item must have oid" unless oid = @params.delete(:oid)
    #     item_type = "topical"
    #
    #     if item = Item.where(:oid => oid, :item_type => "topical").first
    #         item.update_attributes(@params)
    #     else
    #         item = Item.create(@params.merge(:oid => oid, :item_type => item_type))
    #     end
    #
    #     if @context
    #         if tpc = Context.find_by(:identifier => @context)
    #             add_or_update_item_context(item, tpc, item_type)
    #         else
    #             item.destroy
    #             raise ContextError, "Context #{@context} cannot be found."
    #         end
    #     else
    #         @contexts.each do |context|
    #             if tpc = Context.find_by(:identifier => context)
    #                 add_or_update_item_context(item, tpc, item_type)
    #             else
    #                 item.destroy
    #                 raise ContextError, "Context #{context} cannot be found."
    #             end
    #         end
    #     end
    #
    #     item
    # end

    def create_or_elevate_spherical_item
      raise ParamsError, "Spherical item must have oid" unless oid = @params.delete(:oid)
      item_type = "spherical"
      existing_item = false

      if item = Item.where(:oid => oid, :item_type => "spherical").first
        existing_item = true
      else
        item = Item.create(@params.merge(:oid => oid, :item_type => item_type))
      end

      if @context
        if tpc = Context.find_by(:identifier => @context)
          item_ctx = add_or_update_item_context(item, tpc, item_type)
          elevate_in_ctx(item_ctx, item.id, @params[:submitter]) if existing_item
        else
          item.destroy
          raise ContextError, "Context #{@context} cannot be found."
        end
      else
        @contexts.each do |context|
          if tpc = Context.find_by(:identifier => context)
            item_ctx = add_or_update_item_context(item, tpc, item_type)
            elevate_in_ctx(item_ctx, item.id, @params[:submitter]) if existing_item
          else
            item.destroy
            raise ContextError, "Context #{context} cannot be found."
          end
        end
      end

      item
    end

    def elevate_item
        if @params[:item_id].to_s =~ RMongoIdRegex && @params[:entity_id].to_s =~ RMongoIdRegex
            item_id, entity_id = @params[:item_id], @params[:entity_id]
        else
            return nil
        end

        if @context == "*"
            item_ctxs = ItemContext.where(:item_id => item_id).to_ary
        elsif @context
            if ctx = Context.find_by(:identifier => @context)
                item_ctxs = [ItemContext.where(:item_id => item_id, :context_id => ctx.id).first]
            else
                raise ContextError, "Context #{@context} cannot be found."
            end
        else
            item_ctxs = []
            @contexts.each do |context|
                if ctx = Context.find_by(:identifier => context)
                    item_ctxs << ItemContext.where(:item_id => item_id, :context_id => ctx.id).first
                else
                    raise ContextError, "Context #{context} cannot be found."
                end
            end
        end

        return nil if item_ctxs.empty?
        updated = 0
        item_ctxs.each do |ic|
            unless ItemElevator.where(:item => item_id,
                                        :entity => entity_id,
                                        :context => ic.context_id).
                                        and(:created_at.gte => TopicalUtils.item_elevation_expiration.hours.ago).first
                ItemElevator.create(:item => item_id,
                                    :entity => entity_id,
                                    :context => ic.context_id,
                                    :elevation => 1)
                ic.inc(:elevation, 1)
                #ic.touch  #update ItemContext#updated_at
                ic.update_attributes(:sort_order => TopicalUtils.microtime2int(Time.now))
                updated += 1
            end
        end
        updated
    end

    ## class methods
    class << self
        def get_items(context, options={})
            page = options[:page] || 1
            limit = options[:limit] || CarouselPerPage * CarouselInitialPages
            skipto = (page - 1) * CarouselPerPage

            item_types = options[:types] || StoryTypes

            raise ContextError, "Not a valid context." unless context.kind_of?(Context)
            items = context.item_contexts.where(:item_type.in => item_types).order_by(:context_id => "asc", :elevation => "desc", :sort_order => "desc").
            skip(skipto).limit(limit)
            items.map do |s|
                if itm = Item.find(s.item_id)
                    [itm, s.elevation]
                end
            end.compact
        end

        def get_item_page(context, page)
            limit = CarouselPerPage
            skipto = (page - 1) * CarouselPerPage

            raise ContextError, "Not a valid context." unless context.kind_of?(Context)
            items = context.item_contexts.order_by(:context_id => "asc", :elevation => "desc", :sort_order => "desc").
            skip(skipto).limit(limit)
            items.map do |s|
                if itm = Item.find(s.item_id)
                    [itm, s.elevation]
                end
            end.compact
        end

        def get_planetwork_top_stories(initial=true)
            ItemAgent.get_top_stories("planetwork", :initial => initial)
        end


        def get_top_stories(chnl, opts={})
            # get channel
            if chnl.kind_of?(Context)
                channel = chnl
            elsif chnl.to_s =~ RMongoIdRegex
                channel = Context.find(chnl)
            elsif chnl.kind_of?(String)
                channel = Context.find_by(:identifier => chnl)
            else
                raise ContextError, "Unknown input"
            end

            unless channel.context_types.include?("Channel") || channel.context_types.include?("My Channel")
                raise ContextError, "Not a channel"
            end

            # get topics
            if channel.ctx_relations.count > 0
                topics = ContextAgent.new(:context => channel).get_relations
            else
                return []
            end

            # opts
            page = opts[:page] ? opts[:page].to_i : 1
            is_initial = opts[:initial]

            # calcs
            target_size = is_initial ? (CarouselPerPage * CarouselInitialPages).to_f : CarouselPerPage.to_f
            limit = (target_size / topics.length).ceil

            # query
            top_stories_collection = []
            items_seen = {}
            max_length = 0
            result = []
            topics.each_with_index do |topic|
                top_stories = []
                #:context_id => "asc" is just to use the compound index, all context_id's in this query are the same
                item_ctxs = topic.item_contexts.
                order_by(:context_id => "asc", :elevation => "desc", :sort_order => "desc").
                skip(page - 1).limit(limit).to_ary

                if item_ctxs.length > max_length
                    max_length = item_ctxs.length
                end
                if item_ctxs.count > 0
                    item_ctxs.each_with_index do |ic, i|
                        if item = Item.find(ic.item_id)
                            next if items_seen[item.oid]
                            items_seen[item.oid] = true
                            top_stories << [ic.elevation, i, item]
                        end
                    end
                end

                # sort by elevation and then topic alpha, and add to top_stories_collection
                top_stories_collection << top_stories.sort_by {|story| [-(story[0]), story[1]]}.map {|s| [s[2], s[0]]}
            end

            # pick the nth story from each topic and add to result
            max_length.times do
                top_stories_collection.each do |ts|
                    result << ts.shift
                end
            end

            result.compact
        end

        def add_contexts_to_item(item_id, context_list)
            return unless item = Item.find(item_id)
            counter = 0
            sort_order = TopicalUtils.microtime2int(Time.now)
            context_list.each do |ctx|
                if context = Context.find(ctx)
                    unless ItemContext.where(:context_id => ctx, :item_id => item_id).first
                        item_ctx = ItemContext.create(:sort_order => sort_order)
                        context.item_contexts << item_ctx
                        item.item_contexts << item_ctx
                        counter += 1
                    end
                end
            end
            counter
        end

        def get_item_contexts(item_id)
            ItemContext.where(:item_id => item_id).to_ary.map{|item| item.context_id}
        end

        def destroy_item(item_id)
            if item = Item.find(item_id)
                ItemContext.where(:item_id => item_id).destroy_all
                ItemElevator.where(:item_id => item_id).destroy_all
                item.destroy
            end
        end
    end

    private
    def add_or_update_item_context(item, context, item_type, sort_order=nil)
        raise ItemError unless item.kind_of?(Item)
        raise ContextError unless context.kind_of?(Context)
        sort_order = TopicalUtils.microtime2int(Time.now) unless sort_order
        if item_ctx = ItemContext.where(:item_id => item.id, :context_id => context.id).first
            item_ctx.update_attributes(:sort_order => sort_order)
        else
            item_ctx = ItemContext.create(:sort_order => sort_order, :item_type => item_type)
            context.item_contexts << item_ctx
            item.item_contexts << item_ctx
        end
        item_ctx
    end

    def elevate_in_ctx(item_ctx, item_id, entity_id)
      unless ItemElevator.where(:item => item_id,
        :entity => entity_id,
        :context => item_ctx.context_id).
        and(:created_at.gte => TopicalUtils.item_elevation_expiration.hours.ago).first
        ItemElevator.create(:item => item_id,
        :entity => entity_id,
        :context => item_ctx.context_id,
        :elevation => 1)
        item_ctx.inc(:elevation, 1)

        item_ctx.update_attributes(:sort_order => TopicalUtils.microtime2int(Time.now))
      end
    end

end
