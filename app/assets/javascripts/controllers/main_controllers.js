/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
/* global Dropzone */
'use strict';

angular.module('sphericalIoApp.MainControllers', [])
  .controller('MainCtrl', ['$scope', '$rootScope', '$state', '$timeout', '$window', '$http', 'UserInfo', function($scope, $rootScope, $state, $timeout, $window, $http, UserInfo) {
    Dropzone.autoDiscover = false;
    $scope.usersignin = {};
    UserInfo.signedin().then(function(d) {
        $scope.usersignin.signedin = d.signedin;
    });
    $scope.state = $state;
    $scope.rdr2signin = function() {
      $window.location.href = '/';
    };
}])
  .controller('UserCtrl', ['$scope', '$rootScope', 'UserInfo', function($scope, $rootScope, UserInfo) {
    // spheres and menubox under this controller
  }])
  .controller('SignupCtrl', ['$scope', '$rootScope', '$http', '$state', 'UserInfo', function($scope, $rootScope, $http,  $state, UserInfo) {
    $scope.state = $state;
    $scope.show_signup_spinner = false;
    $scope.signup_error = false;
    $scope.show_signup_feedback = false;
    $scope.signup_message = '';
    $scope.signupSubmit = function() {
      if ($scope.signupform.$valid && $scope.signupform.$dirty) {
        var data = {};
        data.handle = $scope.handle;
        data.screen_name = $scope.signupform.screen_name;
        data.email = $scope.signupform.email.$modelValue;
        data.password = $scope.password;
        data.pwd_confirm = $scope.pwd_confirm;
        data.nda_accept = $scope.nda_accept;

        $scope.signupform.$setPristine();

        $http.post('/entity/user_signup', data)
        .success(function(res, status) {
          if (res.success) {
            $scope.show_signup_spinner = false;
            $scope.signup_error = false;
            $scope.show_signup_feedback = true;
            $scope.signup_message = res.notice;
          } else {
            $scope.show_signup_spinner = false;
            $scope.signup_error = true;
            $scope.show_signup_feedback = true;
            $scope.signup_message = res.notice;
          }
        })
        .error(function(res, status) {
          $scope.show_signup_spinner = false;
          $scope.signup_error = true;
          $scope.show_signup_feedback = true;
          $scope.signup_message = "Failed: " + status;
        });
      }
    };
  }])
  .controller('ProfileCtrl', ['$scope', '$timeout', '$http', 'UserInfo', 'UserProfile', function($scope, $timeout, $http, UserInfo, UserProfile) {
    UserProfile.profile().then(function(data) {
        $scope.userprofile = data;
    });
    $scope.ctrlname = "profile";
    $scope.picture_present = false;
    $scope.picture_error = false;
    $scope.checking_screenname = false;
    $scope.checking_email = false;

    $scope.invite_role = "participant";

    $scope.update_user = function() {
      UserInfo.signedin().then(function(d) {
          $timeout(function () {
            $scope.usersignin.signedin.pic = d.signedin.pic;
          }, 0);
      });
    };
    $scope.invitationSubmit = function() {
      if ($scope.invitationform.$valid && $scope.invitationform.$dirty) {
        var data = {};
        data.invite_ctx = $scope.invite_ctx;
        data.invite_sphere = $scope.invite_sphere;
        data.invite_email = $scope.invite_email;
        data.role = $scope.invite_role;
        data.invitation_ps = $scope.invitation_ps;

        $scope.invitationform.$setPristine();
        $scope.show_invite_feedback = false;
        $scope.show_invite_spinner = true;
        $scope.invite_sphere = '';
        $scope.invite_email = '';
        $scope.invitation_ps = '';

        $http.post('/invite/send_invitation', data)
        .success(function(res, status) {
          $scope.show_invite_spinner = false;
          $scope.invite_error = false;
          $scope.show_invite_feedback = true;
          $scope.invite_message = res.msg;
        })
        .error(function(res, status) {
          $scope.show_invite_spinner = false;
          $scope.show_invite_feedback = true;
          $scope.invite_error = true;
          $scope.invite_message = res.msg;
        });
      }
    };
    $scope.userprofileSubmit = function() {
      if ($scope.userprofileform.$valid && $scope.userprofileform.$dirty) {
        var data = {};
        data.screenname = $scope.userprofile.screen_name;
        data.email = $scope.userprofile.email;
        if ($scope.userprofile.screen_name === '') {
          $scope.userprofile.screen_name = $scope.usersignin.signedin.handle;
        }
        $scope.userprofileform.$setPristine();
        $scope.show_prof_feedback = false;
        $scope.show_prof_spinner = true;
        $http.post('/personal_settings/update_profile', data)
        .success(function(res, status) {
          $scope.show_prof_spinner = false;
          $scope.prof_error = false;
          $scope.show_prof_feedback = true;
          $scope.prof_message = res.msg;
        })
        .error(function(res, status) {
          $scope.show_prof_spinner = false;
          $scope.show_prof_feedback = true;
          $scope.prof_error = true;
          $scope.prof_message = res.msg;
        });
      }
    };
    $scope.changepwdSubmit = function() {
      if ($scope.changepwdform.$valid && $scope.changepwdform.$dirty) {
        var data = {};
        data.password = $scope.password;
        data.pwd_confirm = $scope.pwd_confirm;
        $scope.password = "";
        $scope.pwd_confirm = "";
        $scope.changepwdform.$setPristine();
        $scope.show_pwd_feedback = false;
        $scope.show_pwd_spinner = true;
        $http.post('/personal_settings/change_password', data)
        .success(function(res, status) {
          $scope.show_pwd_spinner = false;
          $scope.chpwd_error = false;
          $scope.show_pwd_feedback = true;
          $scope.chpwd_message = res.msg;
        })
        .error(function(res, status) {
          $scope.show_pwd_spinner = false;
          $scope.show_pwd_feedback = true;
          $scope.chpwd_error = true;
          $scope.chpwd_message = res.msg;
        });
      }
    };
  }]);
