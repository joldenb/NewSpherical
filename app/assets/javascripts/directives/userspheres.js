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
.directive('usphereRevert', ['$rootScope', function($rootScope) {
  return {
    restrict: 'A',
    controller: function($scope) {
      var revertable_states = ['invite'];
      $scope.should_revert = function(statename) {
        var revert = false;
        angular.forEach(revertable_states, function(rvstate) {
          if (statename === rvstate) {
            revert = true;
          }
        });
        return revert;
      };
    },
    link: function(scope, elm, attrs) {
      var revertable = false;
      $rootScope.$on('$stateChangeStart',
         function(event, toState, toParams, fromState, fromParams) {
             if (scope.should_revert(toState.name)) {
               elm.children().draggable("option", "revert", true);
               revertable = true;
             } else {
               elm.children().draggable("option", "revert", false);
               revertable = false;
             }
         }
      );
      $rootScope.$on('$locationChangeStart',
         function(listener, arg) {
           if (/\/curate\/feed/.test(arg)) {
             elm.children().draggable("option", "revert", true);
           } else if (!revertable) {
             // don't override $stateChangeStart above
             elm.children().draggable("option", "revert", false);
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
      var formname = elm.closest('form').attr('name'),
      fldname = elm.attr('name');
      elm.droppable({
          accept: '.psphere',
          tolerance: 'touch',
          hoverClass: 'drop-hover',
          drop: function(event, ui) {
            scope.$apply(function() {
              scope[fldname] = ui.draggable.attr('data-sphere');
              scope[formname][fldname].$dirty = true;
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
