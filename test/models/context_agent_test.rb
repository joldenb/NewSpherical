require File.expand_path('../../test_helper', __FILE__)

class ContextAgentTest < ActiveSupport::TestCase
    before do
        Context.destroy_all
        ItemContext.destroy_all
        CtxRelation.destroy_all
        Entity.destroy_all
        EntityContext.destroy_all
        ItemElevator.destroy_all
        Invitee.destroy_all
        Tag.destroy_all
        CtxTag.destroy_all
        @foo = Context.create(:identifier => 'foo', :context_types => ["Public Topic"])
    end

    describe "ContextAgent" do
        it "initializes with a Context, id or identifier string" do
            foo_agent = ContextAgent.new(:context => @foo)
            foo_agent.context.must_equal @foo 
            foo_agent.parent_context.must_be_nil
            foo_agent2 = ContextAgent.new(:context => @foo.id)
            foo_agent2.context.must_equal @foo
            foo_agent3 = ContextAgent.new(:context => "foo")
            foo_agent3.context.must_equal @foo
            proc {ContextAgent.new(:context => "bar")}.must_raise ContextAgent::ContextError
            proc {ContextAgent.new(:context => 12345)}.must_raise ContextAgent::ParamsError

            foo_agent4 = ContextAgent.new(:parent_context => @foo)
            foo_agent4.parent_context.must_equal @foo 
            foo_agent4.context.must_be_nil
            foo_agent5 = ContextAgent.new(:parent_context => @foo.id)
            foo_agent5.parent_context.must_equal @foo
            foo_agent6 = ContextAgent.new(:parent_context => "foo")
            foo_agent6.parent_context.must_equal @foo
            proc {ContextAgent.new(:parent_context => "bar")}.must_raise ContextAgent::ContextError
            proc {ContextAgent.new(:parent_context => 12345)}.must_raise ContextAgent::ParamsError
        end

        it "can create a new subcontext" do
            foo_agent = ContextAgent.new
            proc {foo_agent.create_new_subcontext}.must_raise ContextAgent::ParamsError
            foo_agent2 = ContextAgent.new(:parent_context => @foo, :identifier => "bar", :context_types => ["Institutional"])
            new_subctx = foo_agent2.create_new_subcontext
            new_subctx.class.must_equal Context
            new_subctx.identifier.must_equal "bar"
            new_subctx.context_types.must_include "Institutional"
            @foo.contexts.first.id.must_equal new_subctx.id
        end

        it "can destroy contexts" do
            foo_agent = ContextAgent.new
            proc {foo_agent.destroy_context}.must_raise ContextAgent::ParamsError
            foo_agent2 = ContextAgent.new(:parent_context => @foo, :identifier => "bar")
            new_subctx = foo_agent2.create_new_subcontext
            @foo.context_ids.size.must_equal 1

            foo_agent3 = ContextAgent.new(:context => new_subctx)
            foo_agent3.destroy_context
            Context.where(:identifier => "bar").first.must_be_nil
            @foo.reload
            @foo.context_ids.must_be_empty
            
        end

        it "can create and destroy a new public topic" do
            err = proc {ContextAgent.new.create_new_public_topic}.must_raise ContextAgent::ParamsError
            err.message.must_equal "TopicalTopic instance required"

            new_topic_struct = TopicalTopic.new({ :display_name => "A New Topic", 
                                                  :description => "This is a new topic.",
                                                  :tags => ["foo", "bar"], 
                                                  :visibility => "all"}).topic

            err = proc {ContextAgent.new({:topic => new_topic_struct}).create_new_public_topic}.must_raise ContextAgent::ParamsError
            err.message.must_equal "Creator ID required"

            entity_data = {
                :email=>"person@example.com", 
                :screen_name=>"Test Entity", 
                :handle=>"aperson", 
                :password=>"mypassword"}
            user = EntityAgent.new("foo", entity_data).create_or_update_individual

            new_topic = ContextAgent.new({:topic => new_topic_struct, :creator => user.id}).create_new_public_topic
            new_topic.must_be :instance_of?, Context
            new_topic.display_name.must_equal "A New Topic"
            new_topic.identifier.must_equal "a-new-topic"
            new_topic.description.must_equal "This is a new topic."
            new_topic.ctx_tags.first.tagstring.must_equal "foo"
            new_topic.ctx_tags.last.tagstring.must_equal "bar"
            new_topic.ctx_settings_list.visibility.must_equal "all"

            tag1 = Tag.where(:tagstring => "foo").first
            tag1.used_count.must_equal 1
            tag2 = Tag.where(:tagstring => "bar").first
            tag2.used_count.must_equal 1

            user.reload
            new_role = user.roles.find_by(:context => new_topic.id)
            new_role.must_be_instance_of Role
            new_role.role.must_equal "admin"
            my_channel = EntityAgent.get_my_channel(user.id)
            #check that new topic is entered into My Channel
            user.entity_contexts.find_by(context_id: my_channel.id).must_be :instance_of?, EntityContext

            EntityContext.where(:context_id => new_topic.id, :entity_id => user.id).count.must_equal 1

            #now destroy it
            topic_id = new_topic.id
            ContextAgent.new({:context => new_topic}).destroy_context
            Context.find(topic_id).must_be :nil?
            CtxTag.count.must_be :zero?
            user.reload
            user.roles.find_by(:context => topic_id).must_be :nil?

            tag1 = Tag.where(:tagstring => "foo").first
            tag1.used_count.must_be :zero?
            tag2 = Tag.where(:tagstring => "bar").first
            tag2.used_count.must_be :zero?

            EntityContext.where(:context_id => new_topic.id, :entity_id => user.id).count.must_be :zero?
        end

        it "can add and remove tags correctly" do
            foo_agent = ContextAgent.new(:context => @foo)
            foo_agent.send(:add_tag, "newtag")
            Tag.where(:tagstring => "newtag").count.must_equal 1
            Tag.find_by(:tagstring => "newtag").used_count.must_equal 1
            @foo.reload
            @foo.ctx_tags.where(:tagstring => "newtag").count.must_equal 1

            foo_agent.send(:remove_tag, "newtag")
            Tag.where(:tagstring => "newtag").count.must_equal 1
            Tag.find_by(:tagstring => "newtag").used_count.must_equal 0
            @foo.reload
            @foo.ctx_tags.where(:tagstring => "newtag").count.must_equal 0
        end

        it "can edit a topic's data" do
            entity_data = {
                :email=>"person@example.com", 
                :screen_name=>"Test Entity", 
                :handle=>"aperson", 
                :password=>"mypassword"}
            user = EntityAgent.new("foo", entity_data).create_or_update_individual
            new_topic_struct = TopicalTopic.new({ :display_name => "A New Topic", 
                                                  :description => "This is a new topic.",
                                                  :tags => ["foo", "bar"], 
                                                  :visibility => "all"}).topic
            new_topic = ContextAgent.new({:topic => new_topic_struct, :creator => user.id}).create_new_public_topic
            new_topic.display_name.must_equal "A New Topic"
            new_topic.identifier.must_equal "a-new-topic"
            new_topic.description.must_equal "This is a new topic."
            new_topic.ctx_tags.first.tagstring.must_equal "foo"
            new_topic.ctx_tags.last.tagstring.must_equal "bar"
            new_topic.ctx_settings_list.visibility.must_equal "all"

            new_settings = TopicalTopic.new({:display_name => "A Not So New Topic", 
                                            :description => "No longer a brand new topic.",
                                            :tags => ["foobar", "baz", "foo"], 
                                            :visibility => "participants"}).topic
            ContextAgent.new(:context => new_topic, :topic_data => new_settings).update_topic
            new_topic.reload
            new_topic.display_name.must_equal "A Not So New Topic"
            new_topic.identifier.must_equal "a-new-topic"
            new_topic.description.must_equal "No longer a brand new topic."
            new_topic.ctx_tags.count.must_equal 3
            new_topic.ctx_tags.map{|t| t.tagstring}.all?{|tstr| ["foobar", "baz", "foo"].include?(tstr)}
            new_topic.ctx_settings_list.visibility.must_equal "participants"
        end

        it "can add and remove relations" do
            entity_data = {
                :email=>"person@example.com", 
                :screen_name=>"Test Entity", 
                :handle=>"aperson", 
                :password=>"mypassword"}
            user = EntityAgent.new("foo", entity_data).create_or_update_individual
            new_topic_struct = TopicalTopic.new({ :display_name => "A New Topic", 
                                                  :description => "This is a new topic.",
                                                  :tags => ["foo", "bar"], 
                                                  :visibility => "all"}).topic
            new_topic2_struct = TopicalTopic.new({ :display_name => "A New Topic Too", 
                                                  :description => "This is also new topic.",
                                                  :tags => ["foo", "bar", "baz"], 
                                                  :visibility => "all"}).topic
            new_topic = ContextAgent.new({:topic => new_topic_struct, :creator => user.id}).create_new_public_topic
            new_topic2 = ContextAgent.new({:topic => new_topic2_struct, :creator => user.id}).create_new_public_topic
            @foo.ctx_relations.count.must_equal 0
            err = proc{ContextAgent.new(:context => @foo.id, :relations => new_topic.id).add_relations}.must_raise ContextAgent::ParamsError
            ContextAgent.new(:context => @foo.id, :relations => [new_topic.id, new_topic2.id]).add_relations
            @foo.reload
            @foo.ctx_relations.count.must_equal 2
            CtxRelation.count.must_equal 4  ##counting My Channel additions
            CtxRelation.where(:context_id => @foo.id, :related_to => new_topic.id).first.must_be_instance_of CtxRelation
            CtxRelation.where(:context_id => @foo.id, :related_to => new_topic2.id).first.must_be_instance_of CtxRelation
            ContextAgent.new(:context => @foo.id, :relations => [new_topic.id, new_topic2.id]).remove_relations
            @foo.reload
            @foo.ctx_relations.count.must_equal 0
            CtxRelation.count.must_equal 2 ##counting My Channel additions
        end
    end
end















