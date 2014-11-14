class AdminController < ApplicationController
  include AdminChecks
  before_filter :is_admin

  def index

  end

  def usercheck
    if entity = Entity.find_by(:handle => params[:handle])
      profile = entity.profiles.where(:is_default => true).first
      profile_text = ''
      if !profile
        admin_editable = true
      elsif profile.admin_generated
        profile_text = profile.profiletxt
        admin_editable = true
      else
        profile_text = "Not admin editable"
        admin_editable = false
      end
      render(:json => {:exists => true,
                        :entity_id => entity.id.to_s,
                        :profile_text => profile_text,
                        :admin_editable => admin_editable})
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

  def edit_user_profile
    unless profile_user = Entity.find(params[:userid])
      render :json =>  {"success" => false, "msg" => "no user"} and return
    end
    ctx = params[:ctx_id].present? ? Context.find_by(:identifier => params[:ctx_id]) : Context.find_by(:identifier => "planetwork")
    s = HTML::WhiteListSanitizer.new
    profile_text = s.sanitize(params[:profile_text])
    if profile_user.profiles.length > 0
      if default_profile = profile_user.profiles.where(:is_default => true, :admin_generated => true).first
        default_profile.update_attributes(:profiletxt => profile_text)
        render :json =>  {"success" => true, "msg" => "profile edited"} and return
      else
        render :json =>  {"success" => false, "msg" => "no admin-editable profile"} and return
      end
    else
      profile = Profile.new(:profiletxt => profile_text,
                              :context => ctx.id,
                              :admin_generated => true)
      profile_user.profiles << profile
      render :json =>  {"success" => true, "msg" => "profile created"} and return
    end
  end

  private
  def is_admin
    ctx_id = Context.find_by(:identifier => "planetwork").id
    redirect_to(:root) unless valid_admin(ctx_id)
  end

end
