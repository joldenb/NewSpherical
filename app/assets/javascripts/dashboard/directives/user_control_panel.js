/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalApp.UserControlPanelDirectives', [])
.directive('highlightPanel', [function() {
    return {
        restrict: 'A',
        link: function(scope, elm, attrs) {
            elm.on('mouseenter', function() {
                elm.addClass('tmphighlight');
            })
            .on('mouseleave', function() {
                elm.removeClass('tmphighlight');
            });
        }
    };
}])
.directive('clickPanel', ['$timeout', '$window', '$http', 'SPHR_HST', function($timeout, $window, $http, SPHR_HST) {
    return {
        restrict: 'A',
        scope: {
            panelobj: '='
        },
        link: function(scope, elm, attrs) {
            var close = function() {
                $('#spherical_dashboard_container').hide('slow');
            },
            signin = function() {
                //console.log($window.location.href);
                //$window.location.href = SPHR_HST +'sphere/signin';
                var url = SPHR_HST +'sphere/signin_token',
                sndata = {rtn: $window.location.href,
                        statename: scope.$parent.state.current.name,
                        stateparams: scope.$parent.state.params};
                $http.post(url, sndata)
                .success(function(data) {
                  $window.location.href = SPHR_HST +'sphere/signin/' + data.token;
                });
            };
            elm.on('click', function() {
                if (scope.panelobj.action == 'expand') {
                    var _expanded = $('.expand', '#user_area');
                    _expanded.css({
                        top: elm.position().top,
                        left: elm.position().left
                    });
                    scope.$apply(function() {
                        scope.$parent.panelstate.visible = true;
                    });
                    // timeout necessary so that _expanded gets located
                    // in its contracted state before expanding
                    $timeout(function() {
                        scope.$apply(function() {
                            scope.$parent.panelstate.classes = ['expanded', scope.panelobj.expanded_bg];
                        });
                        scope.$parent.state.go('.ctrlpanel', {destination: scope.panelobj.destination});
                    }, 10);
                } else {
                    switch(scope.panelobj.action) {
                        case 'close':
                            close();
                            break;
                        case 'signin':
                            signin();
                            break;
                    }
                };

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