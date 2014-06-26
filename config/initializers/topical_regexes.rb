TOPICAL_EMAIL_REGEX = '[a-z0-9\.\_\%\+\-]+@[a-z0-9\.\-]+\.[a-z]{2,4}'
#for ruby
REmailRegex = Regexp.new("\\A#{TOPICAL_EMAIL_REGEX}\\z", true)
#for javascript
JEmailRegex = Regexp.new("^#{TOPICAL_EMAIL_REGEX}$", true).inspect

TOPICAL_HANDLE_REGEX = '[a-z0-9\-]+'
#for ruby
RHandleRegex = Regexp.new("\\A#{TOPICAL_HANDLE_REGEX}\\z", true)
#for javascript
JHandleRegex = Regexp.new("^#{TOPICAL_HANDLE_REGEX}$", true).inspect

TOPICAL_CONTEXT_REGEX = '[a-z0-9\-]+'
#for ruby
RContextRegex = Regexp.new("\\A#{TOPICAL_CONTEXT_REGEX}\\z", true)
#for javascript
JContextRegex = Regexp.new("^#{TOPICAL_CONTEXT_REGEX}$", true).inspect

MONGO_OBJECTID_REGEX = '[0-9a-f]{24}'
#for ruby
RMongoIdRegex = Regexp.new("\\A#{MONGO_OBJECTID_REGEX}\\z")

TOPICAL_TOPICNAME_REGEX = '[\w\W]{1,12}(\s[\w\W]{1,12})?'
#for ruby
RTopicnameRegex = Regexp.new("\\A#{TOPICAL_TOPICNAME_REGEX}\\z")

TOPICAL_NOTALLOWEDINTAGS_REGEX = '[^a-z0-9_\-]+'
#for ruby
RNotInTagsRegex = Regexp.new("#{TOPICAL_NOTALLOWEDINTAGS_REGEX}")
