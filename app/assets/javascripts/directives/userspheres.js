/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalIoApp.UserSphereDirectives', [])
.directive('userSphere', ['$http', function($http) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.draggable({stack: ".usphere"});
    }
  };
}])
.directive('usphereRevert', ['$rootScope', '$timeout', '$window', function($rootScope, $timeout, $window) {
  return {
    restrict: 'A',
    controller: function($scope) {
      var revertable_states = ['invite'],
      revertable_paths = [/\/sphere\/invite/, /\/curate\/feed/];
      $scope.should_revert = function(statename, arg) {
        var revert = false;
        if (statename) {
          angular.forEach(revertable_states, function(rvstate) {
            if (statename === rvstate) {
              revert = true;
            }
          });
        } else {
          angular.forEach(revertable_paths, function(rvpath) {
            if (rvpath.test(arg)) {
              revert = true;
            }
          });
        }
        return revert;
      };
    },
    link: function(scope, elm, attrs) {
      var rvpath = $window.location.pathname;
      if (scope.should_revert(null, rvpath)) {
        $timeout(function () {
          elm.draggable("option", "revert", true);
        }, 0);
      } else {
        $timeout(function () {
          elm.draggable("option", "revert", false);
        }, 0);
      }
      $rootScope.$on('$stateChangeStart',
         function(event, toState, toParams, fromState, fromParams) {
             if (scope.should_revert(toState.name)) {
               elm.draggable("option", "revert", true);
             } else {
               elm.draggable("option", "revert", false);
             }
         }
      );
    }
  };
}])
.directive('dropPsphere', [function() {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.droppable({
          accept: '.psphere',
          tolerance: 'touch',
          hoverClass: 'drop-hover',
          drop: function(event, ui) {
            var fdsphere = ui.draggable.attr('data-sphere'),
            fdspherename = ui.draggable.attr('data-spherename');
            scope.$apply(function() {
              scope.invite_sphere = fdsphere;
              scope.invite_sphere_name = fdspherename;
              scope.invitationform.invite_sphere.$dirty = true;
            });
          }
        });
    }
  };
}])
.directive('isInvitable', ['$http', function($http) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      var formname = elm.closest('form').attr('name'),
      fldname = elm.attr('name');
      elm.on('blur', function() {
        if (scope[formname][fldname].$pristine) {
          return;
        }
        if (scope[formname][fldname].$modelValue === '') {
          scope[formname][fldname].$setValidity('required', false);
          return;
        } else {
          scope[formname][fldname].$setValidity('required', true);
        }
        if (!/^[a-z0-9\.\_\%\+\-]+@[a-z0-9\.\-]+\.[a-z]{2,4}$/.test(scope[formname][fldname].$modelValue)) {
          scope[formname][fldname].$setValidity('invalid', false);
          return;
        } else {
          scope[formname][fldname].$setValidity('invalid', true);
        }
        scope.checking_invitable = true;
        var email_to_check = scope[formname][fldname].$modelValue;
        $http.get('/invite/invitable', {params: {email: email_to_check}})
        .success(function(result) {
          if (result.success) {
            scope[formname][fldname].$setValidity('invitable', true);
          } else {
            scope[formname][fldname].$setValidity('invitable', false);
            scope.not_invitable_reason = result.message;
          }
          scope.checking_invitable = false;
        });
      });
    }
  };
}]);
