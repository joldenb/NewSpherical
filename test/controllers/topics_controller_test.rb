require File.expand_path('../../test_helper', __FILE__)

class TopicsControllerTest < ActionController::TestCase
    describe TopicsController do
        before do
            Context.where(:identifier.ne => "planetwork").destroy_all
            @planetwork = Context.where(:identifier => "planetwork", :context_types => ["Institutional", "Channel"]).first_or_create
            @climate = Context.where(:identifier => "climate", :context_types => ["Public Topic"]).first_or_create
            @energy = Context.where(:identifier => "energy", :context_types => ["Public Topic"]).first_or_create
            Entity.destroy_all
            EntityContext.destroy_all
            entity_data = {
                :email=>"person@example.com", 
                :screen_name=>"Test Entity", 
                :handle=>"aperson", 
                :password=>"mypassword"}
            @user = EntityAgent.new("climate", entity_data).create_or_update_individual
            @user.roles << Role.new(:role => "curator", :context => @climate.id)
            @new_topic_data = { :topic_name => "A New Topic", 
                                :topic_description => "This is a new topic",
                                :topic_tags => ["foo", "bar"], 
                                :visibility => "all"}
        end

        it "can check whether an identifier is valid and available" do
            get :check_identifier
            response.status.must_equal 200
            j = ActiveSupport::JSON.decode(response.body)
            j["available"].must_equal false

            get :check_identifier, :topic_name => "Planetwork"
            response.status.must_equal 200
            j = ActiveSupport::JSON.decode(response.body)
            j["available"].must_equal false

            get :check_identifier, :topic_name => "  XXX YYY"
            response.status.must_equal 200
            j = ActiveSupport::JSON.decode(response.body)
            j["available"].must_equal true
            j["identifier"].must_equal "xxx-yyy"
        end

        it "rejects invalid user access" do
            post :preview_new_topic
            response.status.must_equal 401
        end

        it "previews new Topic" do
            session[:user_id] = @user.id  #fake login
            post :preview_new_topic, @new_topic_data
            response.status.must_equal 200
            j = ActiveSupport::JSON.decode(response.body)
            j["success"].must_equal true
            t = ActiveSupport::JSON.decode(j["new_topic"])
            t["identifier"].must_equal "a-new-topic"
        end

        it "creates new Topic" do
            session[:user_id] = @user.id  #fake login
            post :create_new_topic, @new_topic_data
            response.status.must_equal 200
            j = ActiveSupport::JSON.decode(response.body)
            j["success"].must_equal true
            j["display_name"].must_equal "A New Topic"
            Context.find_by(:identifier => "a-new-topic").must_be_instance_of Context
        end

        it "can add, remove and display topic relations" do
            session[:user_id] = @user.id  #fake login
            get :topic_relations, :ctx => @climate.id.to_s
            response.status.must_equal 200
            assigns(:ctx).must_be_instance_of Context
            assigns(:related_topics).must_be_kind_of Array
            assigns(:related_topics).must_be :empty?
            assigns(:all_topics).must_be_kind_of Array
            assigns(:all_topics).length.must_equal 1

            post :add_topic_relations, :ctx => @climate.id.to_s, :relations => [@energy.id.to_s]
            response.status.must_equal 200
            j = ActiveSupport::JSON.decode(response.body)
            j["success"].must_equal true

            get :topic_relations, :ctx => @climate.id.to_s
            assigns(:related_topics).length.must_equal 1
            assigns(:all_topics).must_be :empty?

            post :remove_topic_relations, :ctx => @climate.id.to_s, :relations => [@energy.id.to_s]
            response.status.must_equal 200
            j = ActiveSupport::JSON.decode(response.body)
            j["success"].must_equal true

            get :topic_relations, :ctx => @climate.id.to_s
            assigns(:related_topics).must_be :empty?
            assigns(:all_topics).length.must_equal 1
        end
    end
end
