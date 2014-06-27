Topical::Application.routes.draw do
  use_doorkeeper do
      # it accepts :authorizations, :tokens, :applications and :authorized_applications
      controllers :authorizations => 'custom_authorizations'
    end

  get "/auth/:provider/callback" => 'entity#oauth_signin'
  get "/auth/failure" => 'entity#oauth_failure'

  get "/sphere/signin" => 'sphere#signin'
  
  
  match "dashboard(/:action(/:id)(.:format))" => 'dashboard', :as => "dashboard", :via => [:get, :options]
  
  get "/invite/invitations_form/:group_id" => 'invite#invitations_form'
  get "/invite/invite_with_article_form/:group_id/:article_id" => 'invite#invite_with_article_form'
  get "/invite/accept(/:token)" => 'invite#accept'
  get "/invite/opt_out(/:token)" => 'invite#opt_out'
  post "/invite/send_invitations" => 'invite#send_invitations'
  post "/invite/process_opt_out" => 'invite#process_opt_out'

  post "/topics/preview_new_topic" =>      'topics#preview_new_topic'
  post "/topics/create_new_topic" =>       'topics#create_new_topic'
  get  "/topics/check_identifier" =>       'topics#check_identifier'
  get  "/topics/topic_relations/:ctx" =>   'topics#topic_relations'
  get  "/topics/search_topics"  =>         'topics#search_topics'
  post "/topics/add_topic_relations" =>    'topics#add_topic_relations'
  post "/topics/remove_topic_relations" => 'topics#remove_topic_relations'

  post "/entity/user_signup" => 'entity#user_signup', :as => "user_signup"
  post "/entity/user_signin" => 'entity#user_signin', :as => "user_signin"
  post "/entity/user_signout" => 'entity#user_signout', :as => "user_signout"
  post "/entity/oauth_signup" => 'entity#oauth_signup', :as => "oauth_signup"
  post "/entity/oauth_add_to_account" => 'entity#oauth_add_to_account'
  post "/entity/new_group_accept" => 'entity#new_group_accept'
  get "/entity/reset_pwd(/:reset_key)" => 'entity#reset_pwd'
  post "/entity/reset_pwd_completion" => 'entity#reset_pwd_completion'

  get "/personal_settings/settings" => 'personal_settings#settings'
  post "/personal_settings/add_topics_to_my_channel" => 'personal_settings#add_topics_to_my_channel'
  post "/personal_settings/remove_topics_from_my_channel" => 'personal_settings#remove_topics_from_my_channel'
  get "/personal_settings/search_topics" => 'personal_settings#search_topics'
  get "/personal_settings/personal_profile" => 'personal_settings#personal_profile'
  post "/personal_settings/upload_profile_pic" => 'personal_settings#upload_profile_pic'

  get "/nda" => 'nda#index'

  root :to => 'sphere#signin'
end
