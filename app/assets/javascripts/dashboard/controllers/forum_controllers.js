/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular, WebSocketRails */
'use strict';

angular.module('sphericalApp.ForumControllers', [])
    .controller('MainForumCtrl', ['$scope', '$rootScope', '$http', '$timeout', '$filter', 'SPHR_HST', 'WEBSOCKETS_URL', 'ForumData', function($scope, $rootScope, $http, $timeout, $filter, SPHR_HST, WEBSOCKETS_URL, ForumData) {
        // $scope vars
        $scope.forum = ForumData;
        $scope.forum.presence = [];
        $scope.forum.posts = [];
        $scope.forum.presence_counter = 0;
        $scope.forum.forum_post_text = "";
        $scope.forum.show_fdbk = false;
        $scope.forum.error_fdbk = false;
        $scope.forum.fdbk = "Sending...";

        // $scope functions
        $scope.forum.is_present = function(user) {
            var filtered = $filter('filter')($scope.forum.presence, user, true);
            return filtered.length > 0;
        };
        $scope.forum.submit_post = function() {
            if (/^[\s]*$/.test($scope.forum.forum_post_text)) {
                $scope.forum.forum_post_text = ""; //why doesn't this work here?
                $scope.forum.show_fdbk = true;
                $scope.forum.error_fdbk = true;
                $scope.forum.fdbk = "Enter some text!";
            } else {
                var data = {forum_post_text: $scope.forum.forum_post_text, ctx_id: ForumData.forum_ctx_id, post_id: ForumData.post_id};
                $scope.forum.forum_post_text = " ";
                $scope.forum.fdbk = "Sending...";
                $scope.forum.error_fdbk = false;
                $scope.forum.show_fdbk = true;
                $http.post(SPHR_HST + "forum_persistence/save_forum_post", data)
                .success(
                    function(response) {
                        $scope.forum.fdbk = "Sent!";
                        $timeout(function() {
                            $scope.form_visible = false;
                            $scope.forum.forum_post_text = "";
                            $scope.forum.show_fdbk = false;
                            $scope.forum.fdbk = "Sending...";
                        }, 1500);
                    }
                )
                .error(
                    function(response, status) {
                        $scope.forum.forum_post_text = "";
                        $scope.forum.error_fdbk = true;
                        $scope.forum.fdbk = response.error;
                    }
                );
            }
        };

        // initialize websockets connection
        $scope.forum.dispatcher = new WebSocketRails(WEBSOCKETS_URL);
        $scope.forum.dispatcher.on_open = function(data) {
          // You can trigger new server events inside this callback if you wish.
          $scope.forum.dispatcher.bind('welcome', function(data) {
              console.log(data.message);
          });
        };

        // context dependent functions
        ForumData.change_context = function (forum_ctx_id, post_id) {
          if ((ForumData.forum_ctx_id != forum_ctx_id) || (ForumData.post_id != post_id)) {
            ForumData.forum_ctx_id = forum_ctx_id;
            ForumData.post_id = post_id;
            $scope.forum.channel = $scope.forum.dispatcher.subscribe(post_id);
            $scope.forum.channel.bind('forum_presence_message', function(data) {
                var d = JSON.parse(data);
                $scope.$apply(function() {
                    $scope.forum.presence = d.msg;
                    $scope.forum.presence_counter = d.msg.length;
                });
            });
            $scope.forum.channel.bind('new_forum_message', function(data) {
              var d = JSON.parse(data);
              var item = d.msg;
              $scope.$apply(function() {
                  $scope.forum.posts.unshift(item);
              });
            });

            var success = function(response) {
              var msg = JSON.parse(response.message);
              $scope.forum.posts = [];
              angular.forEach(msg, function(item, n) {
                $scope.$apply(function() {
                    $scope.forum.posts.push(item);
                });
              });
            },
            failure = function(response) {
              console.log("That just totally failed: "+ response.message);
            };
            var message = {post_id: post_id};
            $scope.forum.dispatcher.trigger('forum.recent_messages', message, success, failure);
            $scope.forum.dispatcher.trigger('forum.count_clients', message);
          }

        };

    }]);
