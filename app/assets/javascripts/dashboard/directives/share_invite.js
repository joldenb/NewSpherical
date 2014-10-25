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
.directive('invitableEmail', ['SPHR_HST', '$http', function(SPHR_HST, $http) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      var email_to_check = scope.shareinviteform.invite_email,
      check_invitable_url = SPHR_HST + '/invite/invitable';
      elm.on('blur', function() {
        scope.is_invitable = false;
        if (email_to_check.$pristine) {
          return;
        }
        if (email_to_check.$modelValue === '') {
          scope.$apply(function() {
            email_to_check.$setValidity('required', false);
          });
          return;
        } else {
          scope.$apply(function() {
            email_to_check.$setValidity('required', true);
          });
        }
        if (!/^[a-z0-9\.\_\%\+\-]+@[a-z0-9\.\-]+\.[a-z]{2,4}$/.test(email_to_check.$modelValue)) {
          scope.$apply(function() {
            email_to_check.$setValidity('invalid', false);
          });
          return;
        } else {
          scope.$apply(function() {
            email_to_check.$setValidity('invalid', true);
          });
        }
        $http.get(check_invitable_url, {params: {email: email_to_check.$modelValue}})
        .success(function(result) {
          if (result.success) {
            scope.is_invitable = true;
          }
        });
      });
    }
  };
}]);
