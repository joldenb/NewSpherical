require File.expand_path('../../test_helper', __FILE__)

class EntityAgentTest < ActiveSupport::TestCase
    before do
        Context.destroy_all
        Entity.destroy_all
        EntityContext.destroy_all
    end

    describe "EntityAgent" do
        it "requires a context string or an array of strings as its first arg" do
            i = EntityAgent.new(['foo', 'bar', 'baz'])
            i.class.must_equal EntityAgent
            contexts = i.instance_variable_get(:@contexts)
            contexts.must_equal ['foo', 'bar', 'baz']
            i2 = EntityAgent.new('foo')
            i2.class.must_equal EntityAgent
            context = i2.instance_variable_get(:@context)
            context.must_equal 'foo'
            proc {EntityAgent.new(['foo', 'bar', ['baz']])}.must_raise EntityAgent::ContextError
        end

        it "can create or update Individual entities" do
            foo = Context.create(:identifier => 'foo', :context_types => ["Public Topic"])
            bar = Context.create(:identifier => 'bar', :context_types => ["Public Topic"])

            ctx = Context.find_by(:identifier => "bar")
            puts bar.identifier
            puts ctx.identifier

            i = EntityAgent.new('foo')
            proc {i.create_or_update_individual}.must_raise EntityAgent::ParamsError

            bad_entity_data = {
                :email=>"person@example", 
                :screen_name=>"Test Entity", 
                :handle=>"a!person", 
                :password=>"mypassword"}
            i2 = EntityAgent.new('foo', bad_entity_data)
            proc {i2.create_or_update_individual}.must_raise EntityAgent::ParamsError
            EntityContext.count.must_equal 0

            entity_data = {
                :email=>"person@example.com", 
                :screen_name=>"Test Entity", 
                :handle=>"aperson", 
                :password=>"mypassword"}
            new_entity = EntityAgent.new("foo", entity_data).create_or_update_individual
            new_entity.class.must_equal Entity
            new_entity.authenticate("nope").must_equal false
            authenticated = !!new_entity.authenticate("mypassword")
            authenticated.must_equal true
            new_entity.entity_type.must_equal "Individual"
            new_entity.email.must_equal "person@example.com"
            new_entity.screen_name.must_equal "Test Entity"
            new_entity.entity_contexts.count.must_equal 2 #including the My Context
            new_entity.entity_contexts.first.sort_order.must_be_kind_of Integer
            new_entity.entity_contexts.first.context_id.must_equal foo.id
            new_entity.entity_contexts.first.entity_id.must_equal new_entity.id
            my_channel = EntityAgent.get_my_channel(new_entity.id)
            my_channel.context_types.first.must_equal "My Channel"
            new_entity.reload
            new_entity.roles.count.must_equal 2
            role = new_entity.roles.first
            role.role.must_equal "participant"
            role.context.must_equal foo.id

            new_entity_sort_order = new_entity.entity_contexts.first.sort_order
            entity_data[:handle] = "aperson"
            entity_data[:email] = "person2@example.com"
            entity_data[:screen_name] = "Test Entity Revised"
            revised_entity = EntityAgent.new("foo", entity_data).create_or_update_individual
            revised_entity.class.must_equal Entity
            revised_entity.entity_type.must_equal "Individual"
            revised_entity.email.must_equal "person2@example.com"
            revised_entity.screen_name.must_equal "Test Entity Revised"
            revised_entity.entity_contexts.count.must_equal 2
            revised_entity.entity_contexts.first.context_id.must_equal foo.id
            revised_entity.entity_contexts.first.entity_id.must_equal revised_entity.id
            revised_entity.entity_contexts.first.sort_order.must_equal new_entity_sort_order
            
            # revise by adding a context
            revised_entity_sort_order = revised_entity.entity_contexts.first.sort_order
            entity_data[:handle] = "aperson"
            ctx = Context.find_by(:identifier => "bar")
            puts ctx.identifier
            revised_entity2 = EntityAgent.new(["foo", "bar"], entity_data).create_or_update_individual
            revised_entity2.class.must_equal Entity
            revised_entity2.entity_type.must_equal "Individual"
            revised_entity2.email.must_equal "person2@example.com"
            revised_entity2.screen_name.must_equal "Test Entity Revised"
            revised_entity2.entity_contexts.count.must_equal 3
            revised_entity2.entity_contexts.first.context_id.must_equal foo.id
            revised_entity2.entity_contexts.first.entity_id.must_equal revised_entity2.id
            revised_entity2.entity_contexts.last.context_id.must_equal bar.id
            revised_entity2.entity_contexts.last.entity_id.must_equal revised_entity2.id
            revised_entity2.entity_contexts.first.sort_order.must_equal revised_entity_sort_order
            revised_entity2.entity_contexts.last.sort_order.must_be_kind_of Integer
        end

        it "can create an entity with a LinkedIn oauth login" do
            foo = Context.create(:identifier => 'foo', :context_types => ["Public Topic"])
            signup_topics = ["foo"]
            generated_password = SecureRandom.urlsafe_base64(20)
            user_data = {
                :email => "person@example.com", 
                :handle => "handle", 
                :password => generated_password,
                :password_confirmation => generated_password,
                :oauth_data => {"linkedin"=>{"callback_confirmed"=>true}, 
                                :provider=>"linkedin", 
                                :uid=>"MQbCrL8V3P", 
                                :nym=>"", 
                                :name=>"A Person", 
                                :image=>"http://example.com/images/aperson.png"}}
            new_user = EntityAgent.new(signup_topics, user_data).create_individual_with_social_login
            new_user.class.must_equal Entity
            new_user.handle.must_equal "handle"
            new_user.idps.size.must_equal 1
            new_user.idps.first.provider.must_equal "linkedin"
            new_user.idps.first.uid.must_equal "MQbCrL8V3P"
            new_user.idps.first.nym.must_equal ""
            new_user.idps.first.name.must_equal "A Person"
            new_user.idps.first.image.must_equal "http://example.com/images/aperson.png"
        end

        it "can create an entity with a Twitter oauth login" do
            foo = Context.create(:identifier => 'foo', :context_types => ["Public Topic"])
            signup_topics = ["foo"]
            generated_password = SecureRandom.urlsafe_base64(20)
            user_data = {
                :email => "person@example.com", 
                :handle => "handle", 
                :password => generated_password,
                :password_confirmation => generated_password,
                :oauth_data => {"twitter"=>{"callback_confirmed"=>true}, 
                                :provider=>"twitter", 
                                :uid=>"449126097", 
                                :nym=>"aperson", 
                                :name=>"A Person", 
                                :image=>"http://example.com/images/aperson.png"}}
            new_user = EntityAgent.new(signup_topics, user_data).create_individual_with_social_login
            new_user.class.must_equal Entity
            new_user.handle.must_equal "handle"
            new_user.idps.size.must_equal 1
            new_user.idps.first.provider.must_equal "twitter"
            new_user.idps.first.uid.must_equal "449126097"
            new_user.idps.first.nym.must_equal "aperson"
            new_user.idps.first.name.must_equal "A Person"
            new_user.idps.first.image.must_equal "http://example.com/images/aperson.png"
        end

        it "can create an entity with a Facebook oauth login, and add a Twitter login" do
            foo = Context.create(:identifier => 'foo', :context_types => ["Public Topic"])
            signup_topics = ["foo"]
            generated_password = SecureRandom.urlsafe_base64(20)
            user_data = {
                :email => "person@example.com", 
                :handle => "handle", 
                :password => generated_password,
                :password_confirmation => generated_password,
                :oauth_data => {:provider=>"facebook", 
                                :uid=>"100000521350816", 
                                :nym=>"a.person.98", 
                                :name=>"A Person", 
                                :image=>"http://example.com/images/aperson.png?type=square"}}
            new_user = EntityAgent.new(signup_topics, user_data).create_individual_with_social_login
            new_user.class.must_equal Entity
            new_user.handle.must_equal "handle"
            new_user.idps.size.must_equal 1
            new_user.idps.first.provider.must_equal "facebook"
            new_user.idps.first.uid.must_equal "100000521350816"
            new_user.idps.first.nym.must_equal "a.person.98"
            new_user.idps.first.name.must_equal "A Person"
            new_user.idps.first.image.must_equal "http://example.com/images/aperson.png?type=square"

            twitter_oauth_data = {"twitter"=>{"callback_confirmed"=>true}, 
                                        :provider=>"twitter", 
                                        :uid=>"449126097", 
                                        :nym=>"aperson", 
                                        :name=>"A Person", 
                                        :image=>"http://example.com/images/aperson.png"}
            EntityAgent.add_idp_to_entity(new_user.handle, twitter_oauth_data)
            new_user.reload
            new_user.idps.size.must_equal 2
            new_user.idps.last.provider.must_equal "twitter"
        end

        it "can find entities" do
            foo = Context.create(:identifier => 'foo', :context_types => ["Public Topic"])
            entity1_data = {
                :email=>"person@example.com", 
                :screen_name=>"Test Entity", 
                :handle=>"aperson", 
                :password=>"mypassword"}
            new_entity1 = EntityAgent.new("foo", entity1_data).create_or_update_individual
            entity2_data = {
                :email=>"person2@example.com", 
                :screen_name=>"Test Entity2", 
                :handle=>"aperson2", 
                :password=>"mypassword"}
            new_entity2 = EntityAgent.new("foo", entity2_data).create_or_update_individual

            people = EntityAgent.get_entities(foo)
            people[0].handle.must_equal "aperson2"
            people[1].handle.must_equal "aperson"
        end

        it "can can add an entity to a context" do
            foo = Context.create(:identifier => 'foo', :context_types => ["Public Topic"])
            bar = Context.create(:identifier => 'bar', :context_types => ["Public Topic"])
            entity_data = {
                :email=>"person@example.com", 
                :screen_name=>"Test Entity", 
                :handle=>"aperson", 
                :password=>"mypassword"}
            new_entity = EntityAgent.new("foo", entity_data).create_or_update_individual

            EntityContext.where(:entity_id => new_entity.id).count.must_equal 2 #including the My Context
            EntityAgent.add_entity_to_ctx(new_entity.id, bar.id)
            EntityContext.where(:entity_id => new_entity.id).count.must_equal 3
        end

        it "can add roles to an entity" do
            foo = Context.create(:identifier => 'foo', :context_types => ["Public Topic"])
            bar = Context.create(:identifier => 'bar', :context_types => ["Public Topic"])
            entity_data = {
                :email=>"person@example.com", 
                :screen_name=>"Test Entity", 
                :handle=>"aperson", 
                :password=>"mypassword",
                :role=>"curator"}
            new_entity = EntityAgent.new("foo", entity_data).create_or_update_individual
            EntityAgent.add_role_in_context(new_entity.id, bar.id, "curator")
            new_entity.reload
            new_role = new_entity.roles.find_by(:context => bar.id)
            new_role.must_be_instance_of Role
            new_role.role.must_equal "curator"
        end

        it "can destroy entities" do
            foo = Context.create(:identifier => 'foo', :context_types => ["Public Topic"])
            entity1_data = {
                :email=>"person@example.com", 
                :screen_name=>"Test Entity", 
                :handle=>"aperson", 
                :password=>"mypassword"}
            new_entity1 = EntityAgent.new("foo", entity1_data).create_or_update_individual

            people = EntityAgent.get_entities(foo)
            people.size.must_equal 1
            
            EntityAgent.destroy_entity("aperson")
            people = EntityAgent.get_entities(foo)
            people.size.must_equal 0

        end
    end
end
