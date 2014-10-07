/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalIoApp.SignupDirectives', [])
.directive('acceptInvitation', ['$http', '$window', function($http, $window) {
  return {
    restrict: 'A',
    scope: {
      newgroup: '=',
      article: '='
    },
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        if (scope.newgroup) {
          //already in system
          $http.post('/entity/new_group_accept')
          .success(function(res, status) {
            elm.siblings('.message').html(res.notice);
            scope.$parent.afteraccpt_signin = true;
          })
          .error(function(res, status) {
            elm.siblings('.message').addClass('error').html(res.notice);
            scope.$parent.afteraccpt_signin = true;
          });
        } else {
          $window.location.href = '/sphere/signup';
        }
      });
    }
  };
}]);
