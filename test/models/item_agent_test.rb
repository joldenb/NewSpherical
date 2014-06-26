require File.expand_path('../../test_helper', __FILE__)

class ItemAgentTest < ActiveSupport::TestCase
    before do
        Context.destroy_all
        Item.destroy_all
        ItemContext.destroy_all
        Entity.destroy_all
        EntityContext.destroy_all
        ItemElevator.destroy_all
    end

    describe "ItemAgent" do
        it "requires a context string or an array of strings as its first arg" do
            i = ItemAgent.new(['foo', 'bar', 'baz'])
            i.class.must_equal ItemAgent
            contexts = i.instance_variable_get(:@contexts)
            contexts.must_equal ['foo', 'bar', 'baz']
            i2 = ItemAgent.new('foo')
            i2.class.must_equal ItemAgent
            context = i2.instance_variable_get(:@context)
            context.must_equal 'foo'
            proc {ItemAgent.new(['foo', 'bar', ['baz']])}.must_raise ItemAgent::ContextError
            proc {ItemAgent.new([])}.must_raise ItemAgent::ContextError
        end

        it "can create and revise r88r items" do
            i = ItemAgent.new('foo')
            proc {i.create_or_update_r88r_item}.must_raise ItemAgent::ParamsError

            foo = Context.create(:identifier => 'foo', :context_types => ["Public Topic"])
            bar = Context.create(:identifier => 'bar', :context_types => ["Public Topic"])
            r88rdata = {
                :oid=>"jHZnH3Xl8zNlk4S599v3XA==", 
                :headline=>"Test Item", 
                :text=>"<p>This is a test</p><span class='dotdotdot'></span>", 
                :image_src=>"http://example.com/test.jpg", 
                :image_width=>200, 
                :image_height=>100, 
                :article_uri=>"http://example.com/article/test.html", 
                :source_uri=>"example.com", 
                :source_name=>"Test Example", 
                :timestamp=>1358725551}
            new_item = ItemAgent.new("foo", r88rdata).create_or_update_r88r_item
            new_item.class.must_equal Item
            new_item.item_type.must_equal "r88r"
            new_item.oid.must_equal "jHZnH3Xl8zNlk4S599v3XA=="
            new_item.headline.must_equal "Test Item"
            new_item.item_contexts.count.must_equal 1
            new_item.item_contexts.first.sort_order.must_be_kind_of Integer
            new_item.item_contexts.first.context_id.must_equal foo.id
            new_item.item_contexts.first.item_id.must_equal new_item.id

            new_item_sort_order = new_item.item_contexts.first.sort_order
            r88rdata[:oid] = "jHZnH3Xl8zNlk4S599v3XA=="
            r88rdata[:headline] = "Test Item Revised"
            revised_item = ItemAgent.new("foo", r88rdata).create_or_update_r88r_item
            revised_item.class.must_equal Item
            revised_item.item_type.must_equal "r88r"
            revised_item.oid.must_equal "jHZnH3Xl8zNlk4S599v3XA=="
            revised_item.headline.must_equal "Test Item Revised"
            revised_item.item_contexts.count.must_equal 1
            revised_item.item_contexts.first.context_id.must_equal foo.id
            revised_item.item_contexts.first.item_id.must_equal new_item.id
            revised_item.item_contexts.first.sort_order.must_be :>, new_item_sort_order

            # revise by adding a context
            revised_item_sort_order = revised_item.item_contexts.first.sort_order
            r88rdata[:oid] = "jHZnH3Xl8zNlk4S599v3XA=="
            revised_item2 = ItemAgent.new(["foo", "bar"], r88rdata).create_or_update_r88r_item
            revised_item2.class.must_equal Item
            revised_item2.item_type.must_equal "r88r"
            revised_item2.oid.must_equal "jHZnH3Xl8zNlk4S599v3XA=="
            revised_item2.headline.must_equal "Test Item Revised"
            revised_item2.item_contexts.count.must_equal 2
            revised_item2.item_contexts.first.context_id.must_equal foo.id
            revised_item2.item_contexts.first.item_id.must_equal revised_item2.id
            revised_item2.item_contexts.last.context_id.must_equal bar.id
            revised_item2.item_contexts.last.item_id.must_equal revised_item2.id
            revised_item2.item_contexts.first.sort_order.must_be :>, revised_item_sort_order
            revised_item2.item_contexts.last.sort_order.must_be_kind_of Integer
        end

        it "can find r88r items" do
            foo = Context.create(:identifier => 'foo', :context_types => ["Public Topic"])
            item1_data = {
                :oid=>"jHZnH3Xl8zNlk4S599v3XA==", 
                :headline=>"Test Item", 
                :text=>"<p>This is a test</p><span class='dotdotdot'></span>", 
                :image_src=>"http://example.com/test.jpg", 
                :image_width=>200, 
                :image_height=>100, 
                :article_uri=>"http://example.com/article/test.html", 
                :source_uri=>"example.com", 
                :source_name=>"Test Example", 
                :timestamp=>1358725551}
            new_item1 = ItemAgent.new("foo", item1_data).create_or_update_r88r_item
            item2_data = {
                :oid=>"jHZnH3Xl8zNlk4S599v3XB==", 
                :headline=>"Test Item2", 
                :text=>"<p>This is a test2</p><span class='dotdotdot'></span>", 
                :image_src=>"http://example.com/test2.jpg", 
                :image_width=>200, 
                :image_height=>100, 
                :article_uri=>"http://example.com/article/test2.html", 
                :source_uri=>"example.com", 
                :source_name=>"Test Example2", 
                :timestamp=>1358725552}
            new_item2 = ItemAgent.new("foo", item2_data).create_or_update_r88r_item

            items = ItemAgent.get_items(foo)
            items[0].first.headline.must_equal "Test Item2"
            items[1].first.headline.must_equal "Test Item"
        end

        it "can elevate items" do
            foo = Context.create(:identifier => 'foo', :context_types => ["Public Topic"])
            bar = Context.create(:identifier => 'bar', :context_types => ["Public Topic"])
            a = ItemAgent.new(foo.id.to_s)
            elv = a.elevate_item
            elv.must_be :nil?

            item_data = {:oid=>"jHZnH3Xl8zNlk4S599v3XA=="}
            new_item = ItemAgent.new(["foo", "bar"], item_data).create_or_update_r88r_item
            entity_data = {
                :email=>"person@example.com", 
                :screen_name=>"Test Entity", 
                :handle=>"aperson", 
                :password=>"mypassword"}
            new_entity = EntityAgent.new("foo", entity_data).create_or_update_individual
            ictx1 = ItemContext.where(:item_id => new_item.id.to_s, :context_id => foo.id.to_s).first
            ictx2 = ItemContext.where(:item_id => new_item.id.to_s, :context_id => bar.id.to_s).first
            ictx1.elevation.must_equal 0
            ictx2.elevation.must_equal 0


            elv = ItemAgent.new("foo", {:item_id => new_item.id, 
                                            :entity_id => new_entity.id}).elevate_item
            elv.must_equal 1
            elv2 = ItemAgent.new(["foo", "bar"], {:item_id => new_item.id, 
                                            :entity_id => new_entity.id}).elevate_item
            elv2.must_equal 1
            ItemElevator.count.must_equal 2
            ictx1.reload
            ictx2.reload
            ictx1.elevation.must_equal 1
            ictx2.elevation.must_equal 1
        end
    end
end






