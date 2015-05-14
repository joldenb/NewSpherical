class ManageSpheresController < ApplicationController
    after_filter :add_cors_headers
    layout false

    def create
      render(:nothing => true, :status => 401) and return unless current_user
    end

    private
    def add_cors_headers
      response.headers["Access-Control-Allow-Origin"] = "*"
      response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
      response.headers["Access-Control-Allow-Credentials"] = "true"
      response.headers["Access-Control-Allow-Headers"] = "x-csrf-token, authorization, accept, content-type"
    end

end
