/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalApp.ForumPanelDirectives', [])
.directive('highlightButton', [function() {
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
}])
.directive('commentOc', [function() {
    return {
        restrict: 'A',
        link: function(scope, elm, attrs) {
            elm.on('click', function() {
                if (!scope.forum.form_visible) {
                    scope.$apply(function() {
                        scope.forum.form_visible = true;
                    });
                    elm.html('Close');
                } else {
                    scope.$apply(function() {
                        scope.forum.form_visible = false;
                    });
                    elm.html('Comment');
                }
            });
        }
    };
}])
.directive('postAuthorImage', ['SPHR_HST', function(SPHR_HST) {
    return {
        restrict: 'A',
        scope: {
            imgaddr: '='
        },
        templateUrl: SPHR_HST + "dashboard/profile_pic",
        transclude: true,
        controller: function ($scope) {
            $scope.addr = SPHR_HST + "assets/nopic.png";
            if (/^\/uploads\/entity\/profile_pic/.test($scope.imgaddr)) {
                //remove leading '/'
                $scope.addr = SPHR_HST + $scope.imgaddr.substring(1);
            } else if (/^https?:\/\//.test($scope.imgaddr)) {
                $scope.addr = $scope.imgaddr;
            }
        }
    };
}])