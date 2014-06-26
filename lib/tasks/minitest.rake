require "rake/testtask"

Rake::TestTask.new(:test) do |t|
  t.libs << "test"
  t.pattern = "test/**/*_test.rb"
end

Rake::TestTask.new(:acceptance) do |t|
  t.libs << "test"
  t.pattern = "test/acceptance/*_test.rb"
end

Rake::TestTask.new(:units) do |t|
  t.libs << "test"
  t.pattern = "test/*s/*_test.rb"
end
