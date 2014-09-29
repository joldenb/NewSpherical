/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
/* global Dropzone */
'use strict';

angular.module('sphericalIoApp.MainControllers', [])
  .controller('MainCtrl', ['$scope', '$rootScope', '$state', '$timeout', '$http', 'UserInfo', function($scope, $rootScope, $state, $timeout, $http, UserInfo) {
    Dropzone.autoDiscover = false;
    $scope.usersignin = {};
    UserInfo.signedin().then(function(d) {
        $scope.usersignin.signedin = d.signedin;
    });
}])
  .controller('UserCtrl', ['$scope', 'UserInfo', function($scope, UserInfo) {
    $scope.usersignin = {};
    UserInfo.signedin().then(function(d) {
        $scope.usersignin.signedin = d.signedin;
    });
  }])
  .controller('ProfileCtrl', ['$scope', '$timeout', '$http', 'UserInfo', 'UserProfile', function($scope, $timeout, $http, UserInfo, UserProfile) {
    UserProfile.profile().then(function(data) {
        $scope.userprofile = data;
    });
    $scope.picture_present = false;
    $scope.picture_error = false;
    $scope.checking_screenname = false;
    $scope.checking_email = false;
    $scope.update_user = function() {
      UserInfo.signedin().then(function(d) {
          $timeout(function () {
            $scope.usersignin.signedin.pic = d.signedin.pic;
          }, 0);
      });
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
