/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */

'use strict';

angular.module('sphericalIoApp', [
  'ngSanitize',
  'ngAnimate',
  'ui.router',
  'colorpicker.module',
  'sphericalIoApp.filters',
  'sphericalIoApp.services',
  'sphericalIoApp.directives',
  'sphericalIoApp.controllers'
])
.config(['$httpProvider',function($httpProvider) {
    //http Intercpetor to check auth failures for xhr requests
    $httpProvider.interceptors.push('authHttpResponseInterceptor');
}])
.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
  //$urlRouterProvider.otherwise("/");
  $stateProvider
    .state('home', {
      url: '/'
    })
    .state('profile', {
        url: '/sphere/profile',
        templateUrl: "/personal_settings/profile",
        controller: 'MainCtrl'
    })
    .state('invite', {
        url: '/sphere/invite',
        templateUrl: "/invite/card",
        controller: 'MainCtrl'
    })
    .state('tools', {
        url: '/sphere/tools',
        templateUrl: "/personal_settings/tools",
        controller: 'MainCtrl'
    })
    .state('curate', {
        url: '/curate',
        controller: 'MainCtrl'
    })
    .state('createsphere', {
        url: '/sphere/create',
        templateUrl: "/manage_spheres/create",
        controller: 'MainCtrl'
    });
}])
.config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true);
}]);
