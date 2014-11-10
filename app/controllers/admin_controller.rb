class AdminController < ApplicationController
  include AdminChecks
  before_filter :is_admin

  def index

  end

  def usercheck
    if entity = Entity.find_by(:handle => params[:handle])
      render(:json => {:exists => true, :entity_id => entity.id.to_s})
    else
      render(:json => {:exists => false})
    end
  end

  def upload_profile_pic
    unless profile_user = Entity.find(params[:pic_userid])
      render(:nothing => true, :status => 404) and return
    end
    render(:nothing => true, :status => 403) and return unless params[:ppic].is_a?(ActionDispatch::Http::UploadedFile)

    if !profile_user.profile_pic
      pp = ProfilePic.new
      pp.pic = params[:ppic]
      profile_user.profile_pic = pp
      render :json => {"success" => true} and return
    else
      if profile_user.profile_pic.update_attributes(:pic => params[:ppic])
        render :json => {"success" => true}
      else
        render :json =>  {"success" => false, "msg" => profile_user.errors.to_json}
      end
    end
  end

  private
  def is_admin
    ctx_id = Context.find_by(:identifier => "planetwork").id
    redirect_to(:root) unless valid_admin(ctx_id)
  end

end
