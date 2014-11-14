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
    },
    templateUrl: SPHR_HST + "tpls/user_profile.html"
  };
}]);
