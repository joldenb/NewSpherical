WebsocketRails::EventMap.describe do
  # You can use this file to map incoming events to controller actions.
  # One event can be mapped to any number of controller actions. The
  # actions will be executed in the order they were subscribed.
  #
  # Uncomment and edit the next line to handle the client connected event:
  subscribe :client_connected, :to => ForumController, :with_method => :new_client
  subscribe :client_disconnected, :to => ForumController, :with_method => :close_client
  subscribe :connection_error, :to => ForumController, :with_method => :close_client
  #
  # Here is an example of mapping namespaced events:
  #   namespace :product do
  #     subscribe :new, :to => ProductController, :with_method => :new_product
  #   end
  # The above will handle an event triggered on the client like `product.new`.
  namespace :forum do
    subscribe :recent_messages, :to => ForumController, :with_method => :recent_messages
    subscribe :close_client, :to => ForumController, :with_method => :close_client
    subscribe :count_clients, :to => ForumController, :with_method => :count_clients
  end
end
