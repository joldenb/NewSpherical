require File.expand_path('../../test_helper', __FILE__)

class TopicalTopicTest < ActiveSupport::TestCase
    before do
        @basic_input_data = {:display_name => "A New Topic", 
                            :description => "This is a new topic.",
                            :tags => ["foo", "bar"], 
                            :visibility => "all"}
    end

    describe "TopicalTopic" do
        it "returns a correctly formatted TopicalTopic::Topic object" do
            err = proc {TopicalTopic.new().topic}.must_raise TopicalTopic::ParamsError
            err.message.must_match /topic name/i

            new_topic = TopicalTopic.new(@basic_input_data).topic
            new_topic.must_be :instance_of?, TopicalTopic::Topic
            new_topic.display_name.must_equal "A New Topic"
            new_topic.identifier.must_equal "a-new-topic"
            new_topic.desc.must_equal "This is a new topic."
            new_topic.tags.must_be :kind_of?, Array
            new_topic.tags.join(', ').must_equal "foo, bar"
            new_topic.vis.must_equal "all"
        end

        it "sanitizes and formats the display name and identifier" do
            input_data = @basic_input_data.dup
            input_data[:display_name] = "Thisistoolong"
            new_topic1 = TopicalTopic.new(input_data).topic
            new_topic1.display_name.must_equal "Thisistoolo"
            new_topic1.identifier.must_equal "thisistoolo"

            input_data[:display_name] = "First line ok butsecondlinetoolong"
            new_topic2 = TopicalTopic.new(input_data).topic
            new_topic2.display_name.must_equal "First line"
            new_topic2.identifier.must_equal "first-line"

            input_data[:display_name] = "First line ok if this"
            new_topic2 = TopicalTopic.new(input_data).topic
            new_topic2.display_name.must_equal "First line ok if this"
            new_topic2.identifier.must_equal "first-line-ok-if-this"

            input_data[:display_name] = "Tags <b>not</b> allowed"
            new_topic3 = TopicalTopic.new(input_data).topic
            new_topic3.display_name.must_equal "Tags not allowed"
            new_topic3.identifier.must_equal "tags-not-allowed"
        end

        it "sanitizes and formats the description" do
            input_data = @basic_input_data.dup
            input_data[:description] = "Some stuff" * 30
            input_data[:description].length.must_equal 300
            new_topic1 = TopicalTopic.new(input_data).topic
            new_topic1.desc.length.must_equal 280

            input_data[:description] = %Q{Should allow <b>tags</b> and <a href="example.com">links</a> but not <script type="text/javascript">
alert('oops');</script>.}
            new_topic2 = TopicalTopic.new(input_data).topic
            new_topic2.desc.must_equal %Q{Should allow <b>tags</b> and <a href="example.com">links</a> but not .}
        end

        it "sanitizes and formats tags" do
            input_data = @basic_input_data.dup
            input_data[:tags] = "Not an array"
            new_topic1 = TopicalTopic.new(input_data).topic
            new_topic1.tags.must_equal []

            input_data[:tags] = ["foo", "B_a-R9", "A Space", '4bidd#{#} chars', "", nil]
            new_topic2 = TopicalTopic.new(input_data).topic
            new_topic2.tags.length.must_equal 4
            new_topic2.tags.must_equal ["foo", "b_a-r9", "aspace", "4biddchars"]
        end

        it "restricts visibility to 'all' or 'participants'" do
            input_data = @basic_input_data.dup
            input_data[:visibility] = "Somethingelse"
            new_topic1 = TopicalTopic.new(input_data).topic
            new_topic1.vis.must_equal "participants"

            input_data[:visibility] = "participants"
            new_topic2 = TopicalTopic.new(input_data).topic
            new_topic2.vis.must_equal "participants"

            input_data[:visibility] = "all"
            new_topic3 = TopicalTopic.new(input_data).topic
            new_topic3.vis.must_equal "all"
        end
    end
end