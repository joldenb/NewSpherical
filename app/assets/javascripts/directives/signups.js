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
}])
.directive('optOut', ['$http', '$window', function($http, $window) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      scope.opt_out = 'group';
      scope.after_optout = false;
      elm.on('click', function() {
        var data = {opt_out: scope.opt_out},
        _message = elm.parent().siblings('.message');
        $http.post('/invite/process_opt_out', data)
        .success(function(res, status) {
          if (res.success) {
            _message.html(res.notice);
          } else {
            _message.addClass('error').html(res.notice);
          }
          scope.after_optout = true;
        })
        .error(function(res, status) {
          _message.addClass('error').html(res.notice);
          scope.after_optout = true;
        });
      });
    }
  };
}]);
