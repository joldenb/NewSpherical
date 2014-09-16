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
}]);
