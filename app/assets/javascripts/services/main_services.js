/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalIoApp.MainServices', [])
  .service('UserInfo', ['$http', function($http) {
      this.signedin = function() {
        return $http.get('/sphere/signed_in')
        .then(function(response) {
          return response.data;
        });
      };
  }])
  .service('UserProfile', ['$http', function($http) {
      this.profile = function() {
        return $http.get('/personal_settings/edit_profile')
        .then(function(response) {
          return response.data;
        });
      };
  }]);
