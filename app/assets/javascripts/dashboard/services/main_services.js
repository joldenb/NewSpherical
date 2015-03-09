/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalApp.MainServices', [])
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
    // .service('TopicItems', ['$http', 'SPHR_HST', function($http, SPHR_HST) {
    //     this.get = function(topic, is_channel, page) {
    //       return $http.get(SPHR_HST + 'dashboard/topic_items/' + topic, {
    //         params: {is_channel: is_channel, page: page}
    //       }).then(function(response) {
    //         return response.data;
    //       });
    //     };
    // }])
    .service('FormattedStoryItems', ['$http', 'SPHR_HST', function($http, SPHR_HST) {
        this.get = function(topic, is_channel, page) {
          // topic is a context id
          return $http.get(SPHR_HST + 'dashboard/story_items/' + topic, {
            params: {is_channel: is_channel, page: page}
          }).then(function(response) {
            var formatted = [];
            angular.forEach(response.data.items, function(value) {
                var item = {};
                item.id = value[0]._id;
                if (value[0].image_src) {
                  item.pic = value[0].image_src;
                } else {
                  item.pic = '#';
                }
                item.description = value[0].headline;
                item.article_uri = value[0].article_uri;
                item.created_at = value[0].created_at;
                item.text = value[0].text;
                item.elevation = value[1];
                item.itemtype = 'story';
                formatted.push(item);
            });
            return formatted;
          });
        };
    }])
    // .service('DiscussionItems', ['$http', 'SPHR_HST', function($http, SPHR_HST) {
    //     this.get = function(topic, page) {
    //       return $http.get(SPHR_HST + 'dashboard/discussion_items/' + topic, {
    //         params: {page: page}
    //       }).then(function(response) {
    //         return response.data;
    //       });
    //     };
    // }])
    .service('FormattedDiscussionItems', ['$http', 'SPHR_HST', function($http, SPHR_HST) {
        this.get = function(topic, page) {
          return $http.get(SPHR_HST + 'dashboard/discussion_items/' + topic, {
            params: {page: page}
          }).then(function(response) {
            var formatted = [];
            angular.forEach(response.data.items, function(value) {
              var item = {};
              item.id = value[0]._id;
              item.description = value[0].headline;
              item.text = value[0].text;
              item.oid = value[0].oid;
              item.citations = value[3];
              item.pubdate = value[2].pubdate;
              item.elevation = value[1];
              item.itemtype = 'discussion';
              item.author = value[2].author_handle;
              item.author_id = value[0].submitter;
              item.thumbnail = value[2].thumb;
              formatted.push(item);
            });
            return formatted;
          });
        };
    }])
    .service('FormattedRelatedSpheres', ['$http', 'SPHR_HST', function($http, SPHR_HST) {
        this.get = function(sphere) {
          return $http.get(SPHR_HST + 'dashboard/related_spheres/' + sphere)
          .then(function(response) {
            var formatted = [];
            angular.forEach(response.data.related, function(value) {
                var item = {};
                item.id = value.id;
                if (value.pic) {
                  item.pic = value.pic;
                } else {
                  item.pic = '#';
                }
                item.description = value.name;
                item.ctxname = value.name;
                item.itemtype = value.itemtype;
                formatted.push(item);
            });
            return formatted;
          });
        };
    }])
    .service('FormattedResources', ['$http', 'SPHR_HST', function($http, SPHR_HST ) {
      this.get = function(ctx) {
         var uri = SPHR_HST + 'sphere/resources';
         if (ctx) {
           uri = uri + '/' + ctx;
         }
         return $http.get(uri)
         .then(function(response) {
           var formatted = [];
           angular.forEach(response.data.items, function(value) {
             var item = {};
             item.id = value[0]['_id'];
             item.resource_name = value[0]['resource_name'];
             item.headline = value[0]['headline'];
             item.elevation = value[1];
             item.itemtype = 'resource';
             item.author = value[2]['author_handle'];
             item.author_id = value[0]['submitter'];
             item.thumbnail = value[2]['thumb'];
             item.pubdate = value[2]['pubdate'];
             item.resource_urls = value[3]['resource_urls'];
             item.resource_files = value[3]['resource_files'];
             item.urlscount = value[3]['urlscount'];
             item.filecount = value[3]['filecount'];
             formatted.push(item);
           });
           return formatted;
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
    .service('InvitationInfo', ['$http', 'SPHR_HST', function($http, SPHR_HST) {
        this.get = function(token) {
          return $http.get(SPHR_HST + 'invite/info/' + token)
          .then(function(response) {
            return response.data;
          });
        };
    }])
    .service('UserInfo', ['$http', 'SPHR_HST', function($http, SPHR_HST) {
        this.signedin = function() {
          return $http.get(SPHR_HST + 'sphere/signed_in')
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
    .service('Participants', ['$http', 'SPHR_HST', function($http, SPHR_HST ) {
      this.get = function(ctx) {
         var uri = SPHR_HST + 'sphere/entities';
         if (ctx) {
           uri = uri + '/' + ctx;
         }
         return $http.get(uri)
         .then(function(response) {
           return response.data;
         });
      };
    }])
    .service('Curators', ['$http', 'SPHR_HST', function($http, SPHR_HST ) {
      this.get = function(ctx) {
         var uri = SPHR_HST + 'sphere/curators';
         if (ctx) {
           uri = uri + '/' + ctx;
         }
         return $http.get(uri)
         .then(function(response) {
           return response.data;
         });
      };
    }])
    // .service('Resources', ['$http', 'SPHR_HST', function($http, SPHR_HST ) {
    //   this.get = function(ctx) {
    //      var uri = SPHR_HST + 'sphere/resources';
    //      if (ctx) {
    //        uri = uri + '/' + ctx;
    //      }
    //      return $http.get(uri)
    //      .then(function(response) {
    //        return response.data;
    //      });
    //   };
    // }])
    .factory('authInterceptor', ['$rootScope', '$q', '$window', function ($rootScope, $q, $window) {
      return {
        request: function (config) {
          config.headers = config.headers || {};
          if ($window.sessionStorage.spheretoken) {
            config.headers.Authorization = 'Bearer token="' + $window.sessionStorage.spheretoken + '"';
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
