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
}]);
