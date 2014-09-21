/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
/* global Dropzone */
'use strict';

angular.module('sphericalIoApp.MainControllers', [])
  .controller('MainCtrl', ['$scope', '$rootScope', '$state', '$timeout', '$http', function($scope, $rootScope, $state, $timeout, $http) {
    Dropzone.autoDiscover = false;
    $scope.usersignin = {};
}])
  .controller('UserCtrl', ['$scope', 'UserInfo', function($scope, UserInfo) {
    UserInfo.signedin().then(function(d) {
        $scope.usersignin.signedin = d.signedin;
    });
  }])
  .controller('ProfileCtrl', ['$scope', '$timeout', 'UserInfo', 'UserProfile', function($scope, $timeout, UserInfo, UserProfile) {
    UserProfile.profile().then(function(data) {
        $scope.userprofile = data;
    });
    $scope.picture_present = false;
    $scope.picture_error = false;
    $scope.update_user = function() {
      UserInfo.signedin().then(function(d) {
          $timeout(function () {
            $scope.usersignin.signedin.pic = d.signedin.pic;
          }, 0);
      });
    };
    $scope.changepwdSubmit = function(f) {
      console.log(f);
    };
  }]);
