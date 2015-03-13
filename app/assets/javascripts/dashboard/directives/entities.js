/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
/* global toMarkdown */
'use strict';

angular.module('sphericalApp.EntityDirectives', [])
.directive('userProfile', ['SPHR_HST', function(SPHR_HST) {
  return {
    restrict: 'A',
    scope: {
        thisuser: '=',
        currentuser: '='
    },
    templateUrl: SPHR_HST + "tpls/user_profile.html"
  };
}])
.directive('editUserprof', [function() {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        if (scope.thisuser.id !== scope.currentuser.id) {
          return;
        } else {
          scope.thisuser.profile_edittext = scope.thisuser.profile_text;
          scope.$apply(function() {
            scope.edit_mode = true;
            scope.edit_fbk = null;
            scope.fbk_error = false;
          });
        }
      });
    }
  };
}])
.directive('saveUserprof', ['SPHR_HST', '$http', '$timeout', function(SPHR_HST, $http, $timeout) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        if (scope.thisuser.id !== scope.currentuser.id) {
          return;
        } else {
          var data = {userid: scope.thisuser.id, profile_text: scope.thisuser.profile_edittext};
          $http.post(SPHR_HST + 'personal_settings/edit_profile_text', data)
          .success(function(response) {
            scope.edit_fbk = response.msg;
            if (!response.success) {
              scope.fbk_error = true;
            } else {
              scope.thisuser.profile_text = scope.thisuser.profile_edittext;
            }
          })
          .error(function(response, status) {
            scope.edit_fbk = 'Error: ' + status;
            scope.fbk_error = true;
          });
          scope.$apply(function() {
            scope.edit_mode = false;
            $timeout(function() {
              scope.edit_fbk = null;
              scope.fbk_error = false;
            }, 3000);
          });
        }
      });
    }
  };
}])
.directive('cancelUserprof', [function() {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        scope.$apply(function() {
          scope.edit_mode = false;
          scope.edit_fbk = null;
          scope.fbk_error = false;
        });
      });
    }
  };
}]);
