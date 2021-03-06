/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalApp.UserControlPanelDirectives', [])
.directive('userSphere', ['$http', 'SPHR_HST', function($http, SPHR_HST) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      //elm.draggable({ containment: "parent", stack: ".psphere"});
    }
  };
}])
.directive('userMenu', ['$window', '$http', 'SPHR_HST', function($window, $http, SPHR_HST) {
  return {
      restrict: 'A',
      scope: {
          targt: '@'
      },
      link: function(scope, elm, attrs) {
        var close = function() {
            jQuery('#spherical_dashboard_container').hide();
        },
        signin = function() {
            /* first get a signin token, so that io remembers where to
            redirect you to after successful signin, then redirect
            to io#signin */
            var url = SPHR_HST +'sphere/signin_token',
            sndata = {rtn: $window.location.href,
                    statename: scope.$parent.state.current.name,
                    stateparams: scope.$parent.state.params};
            $http.post(url, sndata)
            .success(function(data) {
              $window.location.href = SPHR_HST +'sphere/signin/' + data.token;
            });
        },
        signout = function() {
            var rtn = $window.location.href;
            delete $window.sessionStorage.spheretoken;
            $window.location.href = SPHR_HST +'sphere/dashboard_signout?rtn=' + rtn;
        },
        invitation = function() {
          var invite_token = $window.sessionStorage.invitation;
          delete $window.sessionStorage.invitation;
          $window.location.href = SPHR_HST +'invite/accept/' + invite_token;
        };
        elm.on('click', function() {
          console.log(scope.targt);
          switch(scope.targt) {
              case 'close':
                  close();
                  break;
              case 'signin':
                  signin();
                  break;
              case 'signout':
                  signout();
                  break;
              case 'invitation':
                  invitation();
                  break;
          }
        });
      }
    };
}])
.directive('panelCloser', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        scope: {},
        link: function(scope, elm, attrs) {
            elm.on('click', function() {
                scope.$apply(function() {
                    scope.$parent.panelstate.classes.push('windowshade');
                });
                scope.$parent.state.go('^');
                $timeout(function() {
                    scope.$apply(function() {
                        scope.$parent.panelstate.classes = [];
                        scope.$parent.panelstate.visible = false;
                    });
                }, 1000);
            });
        }
    };
}]);
