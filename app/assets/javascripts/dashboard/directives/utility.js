/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalApp.UtilityDirectives', [])
.directive('brknImg', [function() {
    return {
        restrict: 'A',
        link: function(scope, elm, attrs) {
            elm.hide();
            elm.load(function() {
                elm.show();
            })
            .error(function() {
                elm.hide();
            });
        }
    };
}])
.directive('containerXtnd', [function() {
    return {
        restrict: 'A',
        link: function(scope, elm, attrs) {
            $('#spherical_dashboard_container').height($(document).height());
        }
    };
}])
.directive('toolTip', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        link: function(scope, elm, attrs) {
            var _tootip = elm.children('div[class^="tooltip"]'),
            timeout_promise;
            elm.on('mouseenter', function() {
                timeout_promise = $timeout(function() {
                    if (elm.children().first().hasClass('active')) {
                        _tootip.show();
                    }
                }, 1000);
            })
            .on('mouseleave', function() {
                $timeout.cancel(timeout_promise);
                _tootip.hide();
            });
        }
    };
}])
.directive('hoverHighlight', [function() {
    return {
        restrict: 'A',
        link: function(scope, elm, attrs) {
            elm.on('mouseenter', function() {
                elm.addClass('highlight');
            })
            .on('mouseleave', function() {
                elm.removeClass('highlight');
            });
        }
    };
}]);
