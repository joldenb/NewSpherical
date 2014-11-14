/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
/* global Dropzone */
'use strict';

angular.module('sphericalIoApp.AdminDirectives', [])
.directive('userExists', ['$http', function($http) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('blur', function() {
        if (scope.useradminform.userhandle.$pristine) {
          return;
        }
        if (scope.useradminform.userhandle.$modelValue === '') {
          scope.useradminform.userhandle.$setValidity('required', false);
          return;
        } else {
          scope.useradminform.userhandle.$setValidity('required', true);
        }
        scope.checking_userhandle = true;
        var handle_to_check = scope.useradminform.userhandle.$modelValue;
        $http.get('/admin/usercheck/' + handle_to_check)
        .success(function(result) {
          if (result.exists) {
            scope.useradminform.userhandle.$setValidity('user_exists', true);
            scope.adminuserdata.userid = result.entity_id;
            scope.adminuserdata.admin_editable = result.admin_editable;
            scope.userprof = result.profile_text;
          } else {
            scope.useradminform.userhandle.$setValidity('user_exists', false);
            scope.adminuserdata.userid = null;
            scope.adminuserdata.admin_editable = null;
            scope.userprof = '';
          }
          scope.checking_userhandle = false;
        });
      });
    }
  };
}])
.directive('adminDzone', [function() {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      scope.adminpPicDropzone = new Dropzone(elm[0],
        {
            url: "/admin/upload_profile_pic",
            paramName: 'ppic',
            clickable: true,
            autoProcessQueue: false,
            uploadMultiple: false,
            maxFilesize: 2,
            dictFileTooBig: "File cannot be larger than 2 MB.",
            dictInvalidFileType: "File must be of type jpg, gif or png.",
            acceptedFiles: ".jpg, .jpeg, .gif, .png"
        }
      )
      .on("drop", function() {
          $('.dz-preview').remove();
      })
      .on("addedfile", function(file) {
        scope.$apply(function() {
          scope.picture_present = true;
        });
      })
      .on("error", function(file, err, xhr) {
          scope.$apply(function() {
            scope.picture_error = true;
          });
          if ((typeof xhr !== 'undefined') && (xhr.status !== 200)) {
              $("span[data-dz-errormessage]")
              .html('Sorry, there was a server error: ' + xhr.statusText + '<br />Please cancel and try again.');
          } else {
              $("span[data-dz-errormessage]")
              .html('Sorry, there was an error: ' + err + '<br />Please cancel and try again.');
          }
      });
    }
  };
}])
.directive('adminSavePic', [function() {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        if (scope.picture_present && !scope.picture_error) {
          scope.adminpPicDropzone.off("sending");
          scope.adminpPicDropzone.on("sending", function(file, xhr, formData) {
            formData.append("pic_userid", scope.adminuserdata.userid);
          });
          scope.adminpPicDropzone.processQueue();
          scope.$apply(function() {
            scope.picture_present = false;
          });
        }
      });
    }
  };
}])
.directive('adminCancelPic', ['$compile', function($compile) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        if (scope.picture_present) {
          scope.adminpPicDropzone.removeAllFiles(true);
          scope.$apply(function() {
            scope.picture_present = false;
            scope.picture_error = false;
          });
        }
      });
    }
  };
}])
.directive('adminSaveProfile', ['$http', function($http) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        if (!scope.adminuserdata.userid) {
          return;
        }
        var data = {};
        data.userid = scope.adminuserdata.userid;
        data.profile_text = scope.userprof;
        scope.savingprof = true;
        $http.post('/admin/edit_user_profile', data)
        .success(function(res, status) {
          if (res.success) {
            scope.savingprof = false;
            scope.prof_error = false;
            scope.prof_fdback = res.msg;
          } else {
            scope.savingprof = false;
            scope.prof_error = true;
            scope.prof_fdback = res.msg;
          }
        })
        .error(function(res, status) {
          scope.savingprof = false;
          scope.prof_error = true;
          scope.prof_fdback = res.msg;
        });
      });
    }
  };
}])
.directive('userprofClearout', [function() {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('focus', function() {
        scope.savingprof = false;
        scope.prof_error = false;
        scope.prof_fdback = '';
      });
    }
  };
}]);
