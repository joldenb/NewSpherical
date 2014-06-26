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
    .service('TopicItems', ['$http', 'SPHR_HST', '$rootScope', function($http, SPHR_HST, $rootScope) {
        this.get = function(topic, page) {
          return $http.get(SPHR_HST + 'dashboard/topic_items/' + topic, {
            params: {page: page}
          }).then(function(response) {
            return response.data;
          });
        };
    }]);
