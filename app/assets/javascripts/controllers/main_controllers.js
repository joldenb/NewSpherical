/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalIoApp.MainControllers', [])
  .controller('MainCtrl', ['$scope', '$rootScope', '$state', '$timeout', '$http', function($scope, $rootScope, $state, $timeout, $http) {

}])
  .controller('UserCtrl', ['$scope','UserInfo', function($scope, UserInfo) {
    UserInfo.signedin().then(function(d) {
        $scope.signedin = d.signedin;
    });
  }])
  .controller('ProfileCtrl', ['$scope', 'UserProfile', function($scope, UserProfile) {
    UserProfile.profile().then(function(data) {
        $scope.userprofile = data;
    });
  }]);
