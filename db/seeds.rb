# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).

Context.where(:identifier => "planetwork", :context_types => ["Institutional"]).first_or_create

R88R[:topics].keys.each do |topic|
    Context.where(:identifier => topic.to_s, :context_types =>  ["Public Topic"]).first_or_create
end

#Monotonic.where(mt: 0).first_or_create
