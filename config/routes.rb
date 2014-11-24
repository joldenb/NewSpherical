Topical::Application.routes.draw do
  use_doorkeeper do
      # it accepts :authorizations, :tokens, :applications and :authorized_applications
      controllers :authorizations => 'custom_authorizations'
    end

  get "/auth/:provider/callback" => 'entity#oauth_signin'
  get "/auth/failure" => 'entity#oauth_failure'

  get "/admin" => 'admin#index'
  get "/admin/usercheck/:handle" => 'admin#usercheck'
  post "/admin/upload_profile_pic" => 'admin#upload_profile_pic'
  post "/admin/edit_user_profile" => 'admin#edit_user_profile'

  get "/sphere/signin(/:token)" => 'sphere#signin', :as => 'signin'
  post "/sphere/signin_token" => 'sphere#signin_token'
  post "/sphere/signin_submit" => 'sphere#signin_submit'
  get "/sphere/signin_verify/:token" => 'sphere#signin_verify'
  get "/sphere/user_ctlpanel_data"  => 'sphere#user_ctlpanel_data'
  post "/sphere/signout_submit" => 'sphere#signout_submit'
  get "/sphere/dashboard_signout" => 'sphere#dashboard_signout'
  get "/sphere/signed_in" => 'sphere#signed_in'
  get "/sphere/signup" => 'sphere#signup'
  get "/sphere/entities(/:ctx_id)" => 'sphere#entities'
  get "/sphere/curators(/:ctx_id)" => 'sphere#curators'

  ## defer to angular routes
  get "/sphere(/*anything)" => 'sphere#index'

  post "/forum_persistence/save_forum_post" => 'forum_persistence#save_forum_post'
  post "/forum_persistence/save_conversation_post" => 'forum_persistence#save_conversation_post'


  match "dashboard(/:action(/:id)(.:format))" => 'dashboard', :as => "dashboard", :via => [:get, :options]

  get "/invite/invitations_form/:group_id" => 'invite#invitations_form'
  get "/invite/invite_with_article_form/:group_id/:article_id" => 'invite#invite_with_article_form'
  get "/invite/card(/:token)" => 'invite#card'
  get "/invite/accept(/:token)" => 'invite#accept'
  get "/invite/opt_out(/:token)" => 'invite#opt_out'
  post "/invite/send_invitations" => 'invite#send_invitations'
  post "/invite/send_invitation" => 'invite#send_invitation'
  post "/invite/with_share" => 'invite#with_share'
  post "/invite/process_opt_out" => 'invite#process_opt_out'
  get "/invite/invitable" => 'invite#invitable'
  get "/invite/info/:token" => 'invite#info'

  post "/topics/preview_new_topic" =>      'topics#preview_new_topic'
  post "/topics/create_new_topic" =>       'topics#create_new_topic'
  get  "/topics/check_identifier" =>       'topics#check_identifier'
  get  "/topics/topic_relations/:ctx" =>   'topics#topic_relations'
  get  "/topics/search_topics"  =>         'topics#search_topics'
  post "/topics/add_topic_relations" =>    'topics#add_topic_relations'
  post "/topics/remove_topic_relations" => 'topics#remove_topic_relations'
  post "/topics/elevate_item" => 'topics#elevate_item'

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
  get "/personal_settings/profile" => 'personal_settings#profile'
  get "/personal_settings/edit_profile" => 'personal_settings#edit_profile'
  post "/personal_settings/change_password" => 'personal_settings#change_password'
  get "/personal_settings/unique_email_check" => 'personal_settings#unique_email_check'
  get "/personal_settings/unique_screenname_check" => 'personal_settings#unique_screenname_check'
  post "/personal_settings/update_profile" => 'personal_settings#update_profile'
  post "/personal_settings/edit_profile_text" => 'personal_settings#edit_profile_text'

  get "/nda" => 'nda#index'

  root :to => 'sphere#signin'
end
