/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalApp.ForumPanelDirectives', [])
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
        //link: function(scope, elm, attrs) {
        //    var addr = SPHR_HST + "assets/nopic.png";
        //    if (/^\/uploads\/entity\/profile_pic/.test(scope.imgaddr)) {
        //        addr = SPHR_HST + scope.imgaddr;
        //    } else if (/^https?:\/\//.test(scope.imgaddr)) {
        //        addr = scope.imgaddr;
        //    }
        //    var img = '<img src="' + addr + '" brkn-img />';
        //    elm.append(img);
        //}
    };
}])