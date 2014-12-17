/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalIoApp.MainServices', [])
  .factory('authHttpResponseInterceptor',['$q','$location', '$window', function($q, $location, $window){
    return {
        response: function(response){
            if (response.status === 401) {
                console.log("Response 401");
            }
            return response || $q.when(response);
        },
        responseError: function(rejection) {
            if (rejection.status === 401) {
                console.log("Response Error 401",rejection);
                // $location.path('/login').search('returnTo', $location.path());
                var rtn = $location.path();
                $window.location.href = '/sphere/signin?rtn=' + rtn;
            }
            return $q.reject(rejection);
        }
    };
  }])
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
  }])
  .service('SphereCloud', ['$http', function($http) {
    this.userspheres = function() {
      return $http.get('/sphere/cloud/user')
      .then(function(response) {
        return response.data;
      });
    };
    this.dashboardsphere = function(dashname) {
      return $http.get('/sphere/cloud/' + dashname)
      .then(function(response) {
        return response.data;
      });
    };
    this.demospheres = function() {
      return $http.get('/sphere/cloud/demo')
      .then(function(response) {
        return response.data;
      });
    };
  }])
  .service('IndexInWords', [function() {
    return function(n) {
      var words = ["one","two","three","four","five","six","seven","eight",
      "nine","ten","eleven","twelve","thirteen","fourteen",
      "fifteen","sixteen","seventeen","eighteen","nineteen","twenty"];
      return words[n];
    };
  }]);
