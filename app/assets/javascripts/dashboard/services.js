'use strict';

/* Services */

angular.module('sphericalApp.services', [])
    .factory('SphereInfo', ['$http', 'SPHR_HST', function($http, SPHR_HST) {
        var sphereInfo = {};
        sphereInfo.sphereData = $http.get(SPHR_HST + "dashboard/sphereinfo")
        .success(
            function(data) {
                return data;
            }
        );
        return sphereInfo;
    }])
    .service('TopicItems', ['$http', 'SPHR_HST', function($http, SPHR_HST) {
        this.get = function(topic, page) {
          return $http.get(SPHR_HST + 'dashboard/topic_items/' + topic, {
            params: {page: page}
          }).then(function(response) {
            return response.data;
          });
        };
    }])
    .service('SigninVerify', ['$http', 'SPHR_HST', function($http, SPHR_HST) {
        this.get = function(token) {
          return $http.get(SPHR_HST + 'sphere/signin_verify/' + token)
          .then(function(response) {
            return response.data;
          });
        };
    }])
    .service('ControlPanelData', ['$http', 'SPHR_HST', function($http, SPHR_HST) {
         this.get = function() {
            return $http.get(SPHR_HST + 'sphere/user_ctlpanel_data')
            .then(function(response) {
              return response.data;
            });
         };
    }])
    .factory('authInterceptor', ['$rootScope', '$q', '$window', function ($rootScope, $q, $window) {
      return {
        request: function (config) {
          config.headers = config.headers || {};
          if ($window.sessionStorage.token) {
            config.headers.Authorization = 'Bearer token="' + $window.sessionStorage.token + '"';
          }
          return config;
        },
        response: function (response) {
          if (response.status === 401) {
            // handle the case where the user is not authenticated
          }
          return response || $q.when(response);
        }
      };
    }]);
