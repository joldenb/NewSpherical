/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
/* global toMarkdown */
'use strict';

angular.module('sphericalApp.ShareInviteDirectives', [])
.directive('shareform', ['SPHR_HST', function(SPHR_HST) {
  return {
    restrict: 'A',
    controller: "ActivityCtrl",
    templateUrl: SPHR_HST + "tpls/share_form.html"
  };
}])
.directive('invitableEmail', ['$http', function($http) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('blur', function() {
        if (scope.shareinviteform.invite_email.$pristine) {
          return;
        }
        if (scope.shareinviteform.invite_email.$modelValue === '') {
          scope.$apply(function() {
            scope.shareinviteform.invite_email.$setValidity('required', false);
          });
          return;
        } else {
          scope.$apply(function() {
            scope.shareinviteform.invite_email.$setValidity('required', true);
          });
        }
        if (!/^[a-z0-9\.\_\%\+\-]+@[a-z0-9\.\-]+\.[a-z]{2,4}$/.test(scope.shareinviteform.invite_email.$modelValue)) {
          scope.$apply(function() {
            scope.shareinviteform.invite_email.$setValidity('invalid', false);
          });
          return;
        } else {
          scope.$apply(function() {
            scope.shareinviteform.invite_email.$setValidity('invalid', true);
          });
        }
        // scope.checking_email = true;
        // var email_to_check = scope.shareinviteform.invite_email.$modelValue;
        // $http.get('/personal_settings/unique_email_check', {params: {email: email_to_check}})
        // .success(function(result) {
        //   scope.shareinviteform.invite_email.$setValidity('unique_email', result.email_unique);
        //   scope.checking_email = false;
        // });
      });
    }
  };
}]);
