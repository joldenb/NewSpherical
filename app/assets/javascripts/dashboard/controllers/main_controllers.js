/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalApp.MainControllers', [])
    .controller('MainCtrl', ['$scope', '$rootScope', '$state', '$timeout', '$http', 'SPHR_HST', 'SphereInfo', 'UserInfo', 'ActivityVis', function($scope, $rootScope, $state, $timeout, $http, SPHR_HST, SphereInfo, UserInfo, ActivityVis) {
        $scope.spheredata = {};
        SphereInfo.sphereData.then(function(d) {
            $scope.spheredata.dashlogo = d.data.dashlogo;
            $scope.spheredata.channelname = d.data.channelname;
            $scope.spheredata.channelstories = d.data.channelstories;
            $scope.spheredata.channelCtxId = d.data.channel_ctx_id;
            $scope.spheredata.related_ids = d.data.related_ids;
        });
        if ($state.includes('sphere')) {
            $scope.openDash = true;
            jQuery('#spherical_dashboard_container').show();
        } else {
            $scope.openDash = false;
        }

        UserInfo.signedin().then(function(d) {
            $scope.signedin = d.signedin;
        });
        $scope.check_signin = function(callback) {
          UserInfo.signedin().then(function(d) {
              callback(d.signedin);
          });
        };
        $rootScope.state = $state;
    }])
    .controller('UserCtrl', ['$scope', '$rootScope', '$state', '$timeout', '$window', 'SPHR_HST', 'ControlPanelData', 'UserInfo', function($scope, $rootScope, $state, $timeout, $window, SPHR_HST, ControlPanelData, UserInfo) {
        $scope.state = $state;
        if ($window.sessionStorage.invitation) {
          $scope.invitation = SPHR_HST + 'invite/accept/' + $window.sessionStorage.invitation;
        }

    }])
    .controller('ActivityCtrl', ['$scope', '$rootScope', '$http', '$state', '$timeout', '$window', '$upload', 'SphereInfo', 'FormattedStoryItems', 'FormattedDiscussionItems', 'FormattedRelatedSpheres', 'FormattedResources', 'Curators', 'Participants', 'ActivityVis', 'ForumData', 'SPHR_HST', function($scope, $rootScope, $http, $state, $timeout, $window, $upload, SphereInfo, FormattedStoryItems, FormattedDiscussionItems, FormattedRelatedSpheres, FormattedResources, Curators, Participants, ActivityVis, ForumData, SPHR_HST) {
        // these all run at page load
        $scope.ctrlname = 'ActivityCtrl';
        $scope.visible = ActivityVis; //used in home.html for ng-show and ng-class
        $scope.spheredata = $scope.spheredata || {};
        $scope.currentTopic = $scope.currentTopic || {};
        $scope.thiswindow = $window;

        $scope.check_signin(function(signedin) {
          ActivityVis.signedin = signedin;
        });

        // next tick after page load
        $timeout(function () {
          $scope.chooser = {};
          $scope.chooser.state = {};
          $scope.carouselIndex = 0;
          $scope.chooser.items = $scope.chooser.items || [];
          $scope.chooser.first_item = '';
          $scope.chooser.state.menuVisible = true;

          SphereInfo.sphereData.then(function(d) {
              $scope.spheredata.channelname = d.data.channelname;
              $scope.spheredata.channelIdentifier = d.data.channel_identifier;
              $scope.spheredata.channelstories = d.data.channelstories;
              $scope.spheredata.channelCtxId = d.data.channel_ctx_id;
              $scope.spheredata.related_ids = d.data.related_ids;
              return $scope.spheredata;
          })
          .then(function(spheredata) {
            if ($state.includes('*.topic.**')) {
              $scope.chooser.state.currentTopic = $state.params.topic;
              if ($state.params.topic == spheredata.channelname) {
                $scope.chooser.state.currentTopicId = spheredata.channelCtxId;
                $scope.chooser.state.channelActive = true;
                $scope.chooser.state.relatedActive = false;
              } else {
                $scope.chooser.state.currentTopic = $state.params.topic;
                $scope.chooser.state.currentTopicId = spheredata.related_ids[$state.params.topic];
                $scope.chooser.state.channelActive = false;
                $scope.chooser.state.relatedActive = true;
              }
            } else {
              // we're at the channel topic
              $scope.chooser.state.currentTopic = spheredata.channelname;
              $scope.chooser.state.currentTopicId = spheredata.channelCtxId;
              $scope.chooser.state.channelActive = true;
            }

            if (Object.getOwnPropertyNames($state.params).length === 0) {
              // we're at the top level of the dashboard
              $scope.get_formatted_story_items($scope.chooser.state.currentTopicId, true)
              .then(function() {
                $scope.set_activestory(0);
                return $scope.chooser.first_item; // this is set to the story id via make_chooser_map()
              })
              .then(function(storyid) {
                $scope.set_carousel_index(storyid);
                $scope.chooser.state.topicIndicatorVisible = true;
                $scope.chooser.state.itemVisible = true;
              });
            } else if ($state.includes('**.story.**')) {
              $scope.get_formatted_story_items($scope.chooser.state.currentTopicId, $scope.chooser.state.channelActive)
              .then(function() {
                var story_idx = $scope.chooser.mapping[$state.params.story];
                $scope.set_activestory(story_idx);
                return $state.params.story; // this is the story id
              })
              .then(function(storyid) {
                $scope.set_carousel_index(storyid);
                $scope.chooser.state.topicIndicatorVisible = true;
                $scope.chooser.state.itemVisible = true;
              });
            } else if ($state.includes('**.discussion.**')) {
              $scope.get_formatted_discussion_items($scope.chooser.state.currentTopicId)
              .then(function() {
                var discussion_idx = $scope.chooser.mapping[$state.params.discussion];
                $scope.set_active_discussion(discussion_idx);
                return $state.params.discussion; // this is the story id
              })
              .then(function(discussionid) {
                $scope.set_carousel_index(discussionid);
                $scope.chooser.state.topicIndicatorVisible = true;
                $scope.chooser.state.itemVisible = true;
                $scope.visible.activity_window = 'discussions';
              });
            }
          });
        }, 0);

        // $scope functions
        $scope.set_carousel_index = function(item_id) {
          var item_idx = $scope.chooser.mapping[item_id];
          $timeout(function () {
            $scope.carouselIndex = item_idx - 1;
          }, 0);
          return item_idx;
        };

        $scope.get_formatted_story_items = function(topic, is_channel, page) {
            return FormattedStoryItems.get(topic, is_channel).then(function(items) {
              $scope.chooser.items = items;
              make_chooser_map(items);
            });
        };
        $scope.set_activestory = function(storyindex) {
          $scope.chooser.state.activeStory = $scope.chooser.items[storyindex];
          ActivityVis.activity_window = 'story';
        };

        $scope.get_formatted_discussion_items = function(topic, page) {
            return FormattedDiscussionItems.get(topic, page).then(function(items) {
              $scope.chooser.items = items;
              make_chooser_map(items);
            });
        };
        $scope.set_active_discussion = function(discussionindex) {
          $scope.chooser.state.currentDiscussion = $scope.chooser.items[discussionindex];
          ActivityVis.activity_window = 'discussion';
        };

        $scope.get_related_spheres = function() {
          $scope.chooser.state.currentDiscussion = null;
          return FormattedRelatedSpheres.get($scope.spheredata.channelCtxId)
          .then(function(relateds) {
            $scope.chooser.items = relateds;
            make_chooser_map(relateds);
          });
        };

        $scope.get_formatted_resource_items = function(topic, page) {
            return FormattedResources.get(topic).then(function(items) {
              $scope.chooser.items = items;
              make_chooser_map(items);
            });
        };
        $scope.set_activeresource = function(resourceindex) {
          $scope.chooser.state.activeResource = $scope.chooser.items[resourceindex];
          ActivityVis.activity_window = 'resources';
        };

        $scope.get_curators = function(topic, page) {
            return Curators.get(topic).then(function(response) {
              $scope.chooser.items = response.curators;
              make_chooser_map(response.curators);
            });
        };

        $scope.set_activecurator = function(curatorindex) {
          $scope.chooser.state.activeCurator = $scope.chooser.items[curatorindex];
          ActivityVis.activity_window = 'curators';
        };

        $scope.get_participants = function(topic, page) {
            return Participants.get(topic).then(function(response) {
              $scope.chooser.items = response.participants;
              make_chooser_map(response.participants);
            });
        };

        $scope.set_activeprofile = function(profileindex) {
          $scope.chooser.state.activeProfile = $scope.chooser.items[profileindex];
          ActivityVis.activity_window = 'profiles';
        };

        $scope.switch_sphere = function(sphere_id, sphere_name, is_channel) {
          $scope.get_formatted_story_items(sphere_id, is_channel)
          .then(function() {
            $scope.set_activestory(0);
            $scope.chooser.state.currentTopicId = sphere_id;
            $scope.chooser.state.currentTopic = sphere_name;
            $scope.chooser.state.channelActive = is_channel;
            $scope.chooser.state.relatedActive = !is_channel;
            return $scope.chooser.first_item; // this is the story id
          })
          .then(function(storyid) {
            $scope.set_carousel_index(storyid);
            $scope.chooser.state.topicIndicatorVisible = true;
            $state.go(
              'sphere.topic.story', {topic: sphere_name, story: storyid}
            );
          });
        };

        // chooser reload functions
        $scope.load_stories = function() {
          var topic = $scope.chooser.state.currentTopicId,
          is_channel = $scope.chooser.state.channelActive;
          $scope.get_formatted_story_items(topic, is_channel)
          .then(function() {
            var current_storyid;
            if ($scope.chooser.state.activeStory) {
              current_storyid = $scope.chooser.state.activeStory.id;
            } else {
              $scope.set_activestory(0);
              current_storyid = $scope.chooser.first_item;
            }
            return current_storyid;
          })
          .then(function(storyid) {
            $scope.set_carousel_index(storyid);
            ActivityVis.activity_window = 'story';
            $scope.chooser.state.topicIndicatorVisible = true;
            $scope.chooser.state.itemVisible = true;
            $state.go(
                'sphere.topic.story', {topic: $scope.chooser.state.currentTopic, story: storyid}
            );
          });
        };

        $scope.load_discussions = function() {
          var topic = $scope.chooser.state.currentTopicId;
          $scope.get_formatted_discussion_items(topic)
          .then(function() {
            var current_discussionid;
            if ($scope.chooser.state.currentDiscussion) {
              current_discussionid = $scope.chooser.state.currentDiscussion.id;
            } else {
              current_discussionid = $scope.chooser.first_item;
            }
            return current_discussionid;
          })
          .then(function(discussionid) {
            var idx = $scope.set_carousel_index(discussionid);
            $scope.set_active_discussion(idx);
            ActivityVis.activity_window = 'discussions';
            $scope.chooser.state.topicIndicatorVisible = true;
            $scope.chooser.state.itemVisible = true;
            ForumData.forum_ctx_id = $scope.chooser.state.currentTopicId;
            ForumData.post_id = discussionid;
            $state.go(
                'sphere.topic.discussion', {topic: $scope.chooser.state.currentTopic, discussion: discussionid}
            );
          });
        };

        $scope.load_resources = function() {
          var topic = $scope.chooser.state.currentTopicId;
          return $scope.get_formatted_resource_items(topic)
          .then(function() {
            var current_resourceid;
            if ($scope.chooser.state.activeResource) {
              current_resourceid = $scope.chooser.state.activeResource.id;
            } else {
              $scope.set_activeresource(0);
              current_resourceid = $scope.chooser.first_item;
            }
            return current_resourceid;
          })
          .then(function(resourceid) {
            $scope.set_carousel_index(resourceid);
            ActivityVis.activity_window = 'resources';
            $scope.chooser.state.topicIndicatorVisible = true;
            // $state.go(
            //     'sphere.topic.resource', {topic: activityController.chooser.state.currentTopic, resource: resourceid}
            // );
            return $scope.chooser.first_item;
          });
        };

        // functions called by certain directives
        $scope.itemctls = function() {
          return  !$scope.visible.overlay && $scope.visible.signedin && $scope.chooser.state.itemVisible && $scope.chooser.state.topicIndicatorVisible;
        };

        $scope.elevateItem = function(item_id, mode) {
          var data = {item_id: item_id},
          idx = 0;
          $http.post(SPHR_HST + 'topics/elevate_item', data)
          .success(function(res, status) {
            $scope.elevation_result = res;
            if (res.success) {
              if (mode === 'discussions') {
                $scope.load_discussions();
              } else if (mode === 'stories') {
                $scope.load_stories();
              } else if (mode === 'resources') {
                $scope.load_resources();
              }
            }
            $timeout(function () {
              $scope.elevation_result.message = null;
            }, 3000);
          });
        };

        $scope.getItemHeadline = function(item_type) {
          if (item_type === 'story') {
            return $scope.chooser.state.activeStory;
          } else if (item_type === 'discussion') {
            return $scope.chooser.state.currentDiscussion;
          } else if (item_type === 'resource') {
            return $scope.chooser.state.activeResource;
          }
        };

        $scope.shareInviteSubmit = function() {
          if ($scope.shareinviteform.$valid && $scope.shareinviteform.$dirty) {
            var data = {};
            data.invite_ctx = $scope.invite_ctx;
            data.invite_sphere = $scope.invite_sphere;
            data.share_url = $window.location.href;
            data.headline = $scope.current_headline;
            data.invite_email = $scope.invite_email;
            data.also_invite = $scope.also_invite;
            data.role = $scope.invite_role;
            data.email_ps = $scope.email_ps;
            data.statename = $state.current.name;
            data.stateparams = $state.params;

            $scope.shareinviteform.$setPristine();
            $scope.show_share_feedback = false;
            $scope.show_share_spinner = true;
            $scope.invite_email = '';
            $scope.email_ps = '';

            $http.post(SPHR_HST + 'invite/with_share', data)
            .success(function(res, status) {
              $scope.show_share_spinner = false;
              $scope.share_error = false;
              $scope.show_share_feedback = true;
              $scope.share_message = res.msg;
            })
            .error(function(res, status) {
              $scope.show_share_spinner = false;
              $scope.show_share_feedback = true;
              $scope.share_error = true;
              $scope.share_message = res.msg;
            });
          }
        };

        // private methods
        var make_chooser_map = function(items) {
          $scope.chooser.mapping = {};
          if (items.length < 1) {
            return;
          }
          $scope.chooser.first_item = items[0].id;
          angular.forEach(items, function(item, idx) {
            $scope.chooser.mapping[item.id] = idx;
          });
        };

        var upload = function (file) {
        if (file && file.length) {
            $upload.upload({
                url: SPHR_HST + 'dashboard/upload_resource_file',
                fields: {'resource_id': $scope.newresource.id,
                'ctx_id': $scope.spheredata.channel_ctx_id},
                file: file
            }).progress(function (evt) {
                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                console.log('progress: ' + progressPercentage + '% ' + angular.toJson(evt.config.file));
            }).success(function (data, status, headers, config) {
                console.log('file ' + angular.toJson(config.file) + 'uploaded. Response: ' + angular.toJson(data));
            });
          }
        };

        // .then(function(topics) {
        //     angular.forEach(topics, function(topic, idx) {
        //         $scope.main_topics.push(topic);
        //     });
        //     console.log('mt: ' + $scope.main_topics.length);
        //     return topics;
        // }).then(function(topics) {
        //     if ($state.params.topic) {
        //       angular.forEach(topics, function(topic, idx) {
        //         if (topic.name == $state.params.topic) {
        //           set_current_topic(idx, true);
        //           get_discussion_items(topic.id).then(function(items) {
        //             if (items.length > 0) {
        //               $scope.currentTopicDiscussions = $scope.topic_discussions[topic.id];
        //             }
        //             if ($state.includes('**.discussion.**')) {
        //               $scope.spheredata.topics = format_discussion_items_simple(items);
        //               var discussion_index = get_item_index(items, $state.params.discussion);
        //               ChooserData.active_discussion = discussion_index;
        //               $scope.currentDiscussion = format_discussion_item(items[discussion_index]);
        //               $scope.current_discussion = $scope.topic_discussions[$scope.currentTopic.id][discussion_index];
        //               ForumData.change_context($scope.currentTopic.id, $scope.current_discussion[0]['_id']);
        //               ActivityVis.stories = false;
        //               ActivityVis.discussions = true;
        //               ActivityVis.discussions_active = true;
        //               ActivityVis.stories_active = false;
        //               ActivityVis.activity_window = 'discussions';
        //               $timeout(function () {
        //                 $scope.topicSwiper.swipeTo(discussion_index - 1, 0, false);
        //               },0);
        //             } else {
        //               switch_topics(topic.id, ($scope.spheredata.channelname == topic.name));
        //               if ($state.includes('**.story')) {
        //                 if ($scope.spheredata.channelname == topic.name) {
        //                   switch_topics($scope.spheredata.channel_ctx_id, true)
        //                   .then(function(x) {
        //                     $scope.topicItems = $scope.spheredata.channelstories;
        //                     $scope.currentTopic = $scope.main_topics[0];
        //                     var storyidx = slide_to_channel_item($scope.spheredata.channelstories);
        //                     $scope.topicSwiper.swipeTo(storyidx - 1, 0, false);
        //                     ChooserData.active_slide = storyidx - 1;
        //                     $scope.itemSwiper.swipeTo(storyidx, 0, false);
        //                   });
        //                 }
        //                 $scope.currentStory = $state.params.story;
        //                 ActivityVis.discussions_active = false;
        //                 ActivityVis.stories_active = true;
        //                 ActivityVis.activity_window = 'stories';
        //               }
        //             }
        //           });
        //           $scope.topicIndicatorVisible = true;
        //           $scope.$parent.openDash = true;
        //           if ($scope.spheredata.channelname == topic.name) {
        //             $scope.channelActive = true;
        //           }
        //         }
        //       });
        //     } else {
        //       //we're at the top level of the dashboard
        //       switch_topics($scope.spheredata.channel_ctx_id, true)
        //       .then(function(items) {
        //         $scope.topicItems = $scope.spheredata.channelstories;
        //         $scope.currentTopic = $scope.main_topics[0];
        //         ActivityVis.discussions_active = false;
        //         ActivityVis.stories_active = true;
        //         ActivityVis.activity_window = 'stories';
        //         $scope.topicIndicatorVisible = true;
        //         $scope.channelActive = true;
        //       });
        //     }
        // });

        // runs on state change
        // $rootScope.$on('$stateChangeStart',
        //    function(event, toState, toParams, fromState, fromParams) {
        //        if (toParams.story) {
        //          $scope.currentStory = toParams.story;
        //        }
        //    }
        // );
        //
        // // $scope functions
        // $scope.activityShow = function(show) {
        //     $scope.visible.shareitem = false;
        //     $scope.visible.noslides = false;
        //     if (ActivityVis.overlay != 'discussion_edit') {
        //       ActivityVis.overlay = null;
        //     }
        //     if (show == 'discussions') {
        //         ActivityVis.stories = false;
        //         ActivityVis.discussions = false;
        //         ActivityVis.discussion_edit = false;
        //         ActivityVis.discussions_active = true;
        //         ActivityVis.stories_active = false;
        //         ActivityVis.curators = false;
        //         ActivityVis.participants = false;
        //         ActivityVis.activity_window = 'discussions';
        //         ActivityVis.unshareable = false;
        //         set_current_discussions($scope.currentTopic.id)
        //         .then(function() {
        //           if ($scope.topic_discussions[$scope.currentTopic.id] && $scope.topic_discussions[$scope.currentTopic.id].length > 0) {
        //             $scope.current_discussion = $scope.topic_discussions[$scope.currentTopic.id][0];
        //             ForumData.change_context($scope.currentTopic.id, $scope.current_discussion[0]['_id']);
        //
        //             if ($scope.currentTopicDiscussions) {
        //               $state.go(
        //                 'sphere.topic.discussion', {topic: $scope.currentTopic.name, discussion: $scope.currentTopicDiscussions[0][0]['_id']}
        //               );
        //             }
        //
        //             $timeout(function () {
        //               ActivityVis.discussions = true;
        //               ActivityVis.activity_window = 'discussions';
        //             }, 500); //otherwise flashes the previously loaded discussion
        //           } else {
        //             if (ActivityVis.signedin) {
        //               ActivityVis.discussion_edit = true;
        //             }
        //             ActivityVis.noslides = "No Discussions Yet";
        //           }
        //         });
        //     } else if (show == 'stories') {
        //         // ActivityVis.stories = true;
        //         // ActivityVis.discussions = false;
        //         // ActivityVis.discussion_edit = false;
        //         // ActivityVis.discussions_active = false;
        //         // ActivityVis.stories_active = true;
        //         // ActivityVis.curators = false;
        //         // ActivityVis.participants = false;
        //         ActivityVis.activity_window = 'stories';
        //         ActivityVis.unshareable = false;
        //
        //         if ($scope.spheredata.channelname == $scope.currentTopic.name) {
        //           switch_topics($scope.spheredata.channel_ctx_id, true)
        //           .then(function() {
        //             $scope.topicItems = $scope.spheredata.channelstories;
        //             $scope.currentTopic = $scope.main_topics[0];
        //             $scope.currentTopicIdx = 0;
        //             update_current_topic(0, true);
        //             $scope.channelActive = true;
        //             $compile(ChooserData.tswiper)($scope);
        //             $compile($scope.itemSwiper)($scope);
        //             // $scope.topicSwiper is instantiated by the swiperReady directive
        //             $scope.topicSwiper.init();
        //             $scope.itemSwiper.init();
        //           });
        //         } else {
        //           switch_topics($scope.currentTopic.id);
        //         }
        //         if ($scope.currentStory) {
        //             $state.go(
        //                 'sphere.topic.story', {topic: $scope.currentTopic.name, story: $scope.currentStory}
        //             );
        //         } else if ($state.includes('**.topic.**') && ($scope.spheredata.channelname != $scope.currentTopic.name)) {
        //            $state.go(
        //                'sphere.topic', {topic: $scope.currentTopic.name}
        //            );
        //         } else {
        //           // otherwise page reload won't reload channel top stories
        //           $state.go(
        //             'sphere'
        //           );
        //         }
        //     } else if (show == 'participants') {
        //        load_participants();
        //        ActivityVis.discussions = false;
        //        ActivityVis.discussion_edit = false;
        //        ActivityVis.stories = false;
        //        ActivityVis.curators = false;
        //        ActivityVis.participants = true;
        //        ActivityVis.activity_window = 'participants';
        //        ActivityVis.unshareable = true;
        //        ActivityVis.overlay = null;
        //     } else if (show == 'curators') {
        //        load_curators();
        //        ActivityVis.discussions = false;
        //        ActivityVis.discussion_edit = false;
        //        ActivityVis.stories = false;
        //        ActivityVis.curators = true;
        //        ActivityVis.participants = false;
        //        ActivityVis.activity_window = 'curators';
        //        ActivityVis.unshareable = true;
        //        ActivityVis.overlay = null;
        //     } else if (show == 'resources') {
        //        load_resources($scope.currentTopic.id);
        //        ActivityVis.activity_window = 'resources';
        //        ActivityVis.unshareable = true;
        //        ActivityVis.overlay = null;
        //     }
        // };
        // $scope.channeltopic = function() {
        //   switch_topics($scope.spheredata.channel_ctx_id, true);
        //   $scope.topicItems = $scope.spheredata.channelstories;
        //   $scope.currentTopic = $scope.main_topics[0];
        //   $scope.currentTopicIdx = 0;
        //   update_current_topic(0, true);
        //   // ActivityVis.discussions_active = false;
        //   // ActivityVis.stories_active = true;
        //
        //   ActivityVis.stories = true;
        //   ActivityVis.discussions = false;
        //   ActivityVis.discussion_edit = false;
        //   ActivityVis.discussions_active = false;
        //   ActivityVis.stories_active = true;
        //   ActivityVis.curators = false;
        //   ActivityVis.participants = false;
        //   ActivityVis.activity_window = 'stories';
        //   ActivityVis.overlay = null;
        //
        //   ChooserData.active_slide = 0;
        //   $scope.topicIndicatorVisible = true;
        //   $scope.channelActive = true;
        //   $compile(ChooserData.tswiper)($scope);
        //   $compile($scope.itemSwiper)($scope);
        //   // $scope.topicSwiper is instantiated by the swiperReady directive
        //   $scope.topicSwiper.init();
        //   $scope.itemSwiper.init();
        //   $state.go(
        //     'sphere'
        //   );
        // };
        // $scope.visible.itemctls = function() {
        //     if ($scope.visible.signedin && $state.includes('**.topic.*')) {
        //         return true;
        //     } else {
        //         return false;
        //     }
        // };
        // $scope.visible.topicctls = function() {
        //     if ($scope.visible.signedin && $state.includes('**.topic.**')) {
        //         return true;
        //     } else {
        //         return false;
        //     }
        // };
        // $scope.switch_chooser = function(chooser_state) {
        //   if (chooser_state == 'discussions') {
        //     set_current_discussions($scope.currentTopic.id);
        //     $scope.topicSwiper.swipeTo(ChooserData.active_discussion, 0, false);
        //     ActivityVis.discussions_active = true;
        //     ActivityVis.stories_active = false;
        //     ActivityVis.activity_window = 'discussions';
        //   } else if (chooser_state == 'stories') {
        //     switch_topics($scope.currentTopic.id);
        //     $scope.topicSwiper.swipeTo(ChooserData.active_slide, 0, false);
        //     ActivityVis.discussions_active = false;
        //     ActivityVis.stories_active = true;
        //     ActivityVis.activity_window = 'stories';
        //   }
        // };
        // $scope.slide_select = function(slide_index, slide_id, current_story_id) {
        //     set_current_topic(slide_index, true);
        //     switch_topics(slide_id);
        //     get_discussion_items(slide_id).then(function(items) {
        //       if (items.length > 0) {
        //         $scope.currentTopicDiscussions = $scope.topic_discussions[slide_id];
        //       }
        //     });
        //     $scope.$apply(function() {
        //         $scope.topicIndicatorVisible = true;
        //     });
        //     if (current_story_id) {
        //         $scope.current_story_id = current_story_id;
        //         $state.go(
        //             'sphere.topic.story', {topic: $scope.currentTopic.name, story: current_story_id}
        //         );
        //     } else {
        //        $state.go(
        //            'sphere.topic', {topic: $scope.currentTopic.name}
        //        );
        //     }
        // };
        // $scope.restore_topic_list = function() {
        //     restore_topic_list();
        //     $scope.visible.shareitem = false;
        //     $timeout(function () {
        //       $scope.$apply(function() {
        //           $scope.topicIndicatorVisible = false;
        //           ActivityVis.noslides = false;
        //           ActivityVis.stories = true;
        //           ActivityVis.discussions = false;
        //           ActivityVis.discussion_edit = false;
        //           ActivityVis.activity_window = 'stories';
        //           $scope.channelActive = false;
        //           ActivityVis.overlay = null;
        //
        //           ActivityVis.show_drag_target = false;
        //           ActivityVis.swipe_enable = true;
        //           ChooserData.thispost_disabled = false;
        //           ChooserData.active_slide = 0;
        //           $compile(ChooserData.tswiper)($scope);
        //       });
        //       // $scope.topicSwiper is instantiated by the swiperReady directive
        //       $scope.topicSwiper.init();
        //       $state.go(
        //           'sphere'
        //       );
        //     }, 100);
        // };
        // $scope.adjacent_topic = function(adjacent_topic_index) {
        //     $scope.visible.shareitem = false;
        //     $scope.$apply(function() {
        //         ActivityVis.stories = true;
        //         ActivityVis.discussions = false;
        //         ActivityVis.discussion_edit = false;
        //         ActivityVis.activity_window = 'stories';
        //
        //         ActivityVis.show_drag_target = false;
        //         ActivityVis.swipe_enable = true;
        //         ChooserData.thispost_disabled = false;
        //         ChooserData.active_slide = 0;
        //         $compile(ChooserData.tswiper)($scope);
        //     });
        //     switch_topics($scope.main_topics[adjacent_topic_index].id);
        //     $scope.currentTopicIdx = adjacent_topic_index;
        //     update_current_topic(adjacent_topic_index);
        //     get_discussion_items($scope.main_topics[adjacent_topic_index].id);
        //     // $scope.topicSwiper and $scope.itemSwiper are instantiated by the swiperReady
        //     // and itemSwiperReady directives
        //     $scope.topicSwiper.init();
        //     $scope.itemSwiper.init();
        //     $state.go(
        //         'sphere.topic', {topic: $scope.currentTopic.name}
        //     );
        // };
        // $scope.slide_to_item = function() {
        //     if ($state.params.story) {
        //         angular.forEach($scope.topics[$scope.currentTopic.id], function(item, idx) {
        //             if (item[0]['_id'] == $state.params.story) {
        //                 $scope.itemSwiper.swipeTo(idx, 0, false);
        //                 if (idx > 1) {
        //                     $timeout(function() {
        //                         try{
        //                             $scope.topicSwiper.swipeTo(idx - 1, 0, false);
        //                             ChooserData.active_slide = idx - 1;
        //                         }
        //                         catch(e){
        //                             //suppress error if $scope.topicSwiper was null
        //                         }
        //                     }, 500);
        //                 }
        //             }
        //         });
        //     } else if($state.params.discussion) {
        //       //todo
        //     }  else {
        //         $scope.itemSwiper.swipeTo(0, 0, false);
        //         ChooserData.active_slide = 0;
        //     }
        // };
        // $scope.refresh_conversations = function() {
        //   get_discussion_items($scope.currentTopic.id).then(function() {
        //     $scope.currentTopicDiscussions = $scope.topic_discussions[$scope.currentTopic.id];
        //     set_current_discussions($scope.currentTopic.id);
        //     $scope.current_discussion = $scope.topic_discussions[$scope.currentTopic.id][0];
        //     ForumData.change_context($scope.currentTopic.id, $scope.current_discussion[0]['_id']);
        //   });
        // };
        // $scope.load_current_discussion = function(idx) {
        //   $scope.current_discussion = $scope.topic_discussions[$scope.currentTopic.id][idx];
        //   $scope.currentDiscussion = format_discussion_item($scope.current_discussion);
        //   ChooserData.active_discussion = idx;
        //   ForumData.change_context($scope.currentTopic.id, $scope.current_discussion[0]['_id']);
        // };
        // $scope.load_profile = function(idx) {
        //   $scope.thisuser = $scope.spheredata.topics[idx];
        // };
        // $scope.load_resource = function(idx) {
        //   $scope.thisresource = format_resource_item($scope.resource_items[idx]);
        // };
        // $scope.get_item_index = function(items, item_id) {
        //   return get_item_index(items, item_id);
        // };
        // $scope.invite_role = 'participant';
        // $scope.shareInviteSubmit = function() {
        //   if ($scope.shareinviteform.$valid && $scope.shareinviteform.$dirty) {
        //     var data = {};
        //     data.invite_ctx = $scope.invite_ctx;
        //     data.invite_sphere = $scope.invite_sphere;
        //     data.share_url = $window.location.href;
        //     data.headline = $scope.current_headline;
        //     data.invite_email = $scope.invite_email;
        //     data.also_invite = $scope.also_invite;
        //     data.role = $scope.invite_role;
        //     data.email_ps = $scope.email_ps;
        //     data.statename = $state.current.name;
        //     data.stateparams = $state.params;
        //
        //     $scope.shareinviteform.$setPristine();
        //     $scope.show_share_feedback = false;
        //     $scope.show_share_spinner = true;
        //     $scope.invite_email = '';
        //     $scope.email_ps = '';
        //
        //     $http.post(SPHR_HST + 'invite/with_share', data)
        //     .success(function(res, status) {
        //       $scope.show_share_spinner = false;
        //       $scope.share_error = false;
        //       $scope.show_share_feedback = true;
        //       $scope.share_message = res.msg;
        //     })
        //     .error(function(res, status) {
        //       $scope.show_share_spinner = false;
        //       $scope.show_share_feedback = true;
        //       $scope.share_error = true;
        //       $scope.share_message = res.msg;
        //     });
        //   }
        // };
        // $scope.elevation_result = {};
        // $scope.elevateItem = function(item_id, mode) {
        //   var data = {item_id: item_id},
        //   idx = 0;
        //   $http.post(SPHR_HST + 'topics/elevate_item', data)
        //   .success(function(res, status) {
        //     if (res.success) {
        //       if (mode === 'discussions') {
        //         set_current_discussions($scope.currentTopic.id);
        //       } else if ($scope.spheredata.channelname == $scope.currentTopic.name) {
        //         switch_topics($scope.spheredata.channel_ctx_id, true)
        //         .then(function() {
        //           $scope.topicItems = $scope.spheredata.channelstories;
        //           $scope.currentTopic = $scope.main_topics[0];
        //           $scope.currentTopicIdx = 0;
        //           update_current_topic(0, true);
        //           $scope.channelActive = true;
        //           $compile(ChooserData.tswiper)($scope);
        //           $compile($scope.itemSwiper)($scope);
        //           // $scope.topicSwiper is instantiated by the swiperReady directive
        //           $scope.topicSwiper.init();
        //           $scope.itemSwiper.init();
        //         });
        //       } else {
        //         switch_topics($scope.currentTopic.id);
        //       }
        //       update_current_topic($scope.currentTopicIdx);
        //       set_current_discussions($scope.currentTopic);
        //     }
        //     $scope.elevation_result = res;
        //     $timeout(function () {
        //       $scope.elevation_result = {};
        //       var newidx = get_item_index($scope.topics[$scope.currentTopic.id], item_id);
        //       if (newidx > 1) {
        //           $scope.topicSwiper.swipeTo(newidx - 1, 300, false);
        //           ChooserData.active_slide = newidx - 1;
        //       } else {
        //           $scope.topicSwiper.swipeTo(0, 300, false);
        //           ChooserData.active_slide = 0;
        //       }
        //     }, 2000);
        //   });
        // };
        //
        // // private functions
        // var format_topic_items_simple = function(items) {
        //     var formatted = [];
        //     angular.forEach(items, function(value) {
        //         var item = {};
        //         item.id = value[0]['_id'];
        //         item.pic = value[0]['image_src'];
        //         item.description = value[0]['headline'];
        //         item.article_uri = value[0]['article_uri'];
        //         item.elevation = value[1];
        //         item.itemtype = 'story';
        //         formatted.push(item);
        //     });
        //     return formatted;
        // },
        // format_discussion_items_simple = function(items) {
        //     var formatted = [];
        //     angular.forEach(items, function(value) {
        //         var item = {};
        //         item.id = value[0]['_id'];
        //         item.description = value[0]['headline'];
        //         item.pubdate = value[2]['pubdate'];
        //         item.elevation = value[1];
        //         item.itemtype = 'discussion';
        //         item.author = value[2]['author_handle'];
        //         item.thumbnail = value[2]['thumb'];
        //         formatted.push(item);
        //     });
        //     return formatted;
        // },
        // format_discussion_item = function(item) {
        //   if (!angular.isArray(item)) {
        //     return;
        //   }
        //   var formatted = {};
        //   formatted.id = item[0]['_id'];
        //   formatted.description = item[0]['headline'];
        //   formatted.text = item[0]['text'];
        //   formatted.oid = item[0]['oid'];
        //   formatted.citations = item[3];
        //   formatted.pubdate = item[2]['pubdate'];
        //   formatted.elevation = item[1];
        //   formatted.itemtype = 'discussion';
        //   formatted.author = item[2]['author_handle'];
        //   formatted.author_id = item[0]['submitter'];
        //   formatted.thumbnail = item[2]['thumb'];
        //   return formatted;
        // },
        // format_resource_items_simple = function(items) {
        //     var formatted = [];
        //     angular.forEach(items, function(value) {
        //         var item = {};
        //         item.id = value[0]['_id'];
        //         item.description = value[0]['resource_name'];
        //         item.elevation = value[1];
        //         item.itemtype = 'resource';
        //         item.author = value[2]['author_handle'];
        //         item.thumbnail = value[2]['thumb'];
        //         item.pubdate = value[2]['pubdate'];
        //         item.urlscount = value[3]['urlscount'];
        //         item.filecount = value[3]['filecount'];
        //         formatted.push(item);
        //     });
        //     return formatted;
        // },
        // format_resource_item = function(item) {
        //     if (!angular.isArray(item)) {
        //       return;
        //     }
        //     var formatted = {};
        //     formatted.id = item[0]['_id'];
        //     formatted.resource_name = item[0]['resource_name'];
        //     formatted.headline = item[0]['headline'];
        //     formatted.elevation = item[1];
        //     formatted.itemtype = 'resource';
        //     formatted.author = item[2]['author_handle'];
        //     formatted.author_id = item[0]['submitter'];
        //     formatted.thumbnail = item[2]['thumb'];
        //     formatted.pubdate = item[2]['pubdate'];
        //     formatted.resource_urls = item[3]['resource_urls'];
        //     formatted.resource_files = item[3]['resource_files'];
        //     return formatted;
        // },
        // get_topic_items = function(topic, is_channel) {
        //     return TopicItems.get(topic, is_channel).then(function(d) {
        //         $scope.topics[topic] = d.items;
        //     }).then(function() {
        //         return $scope.topics[topic];
        //     });
        // },
        // switch_topics = function(topic_ctx, is_channel) {
        //     // have to do this, else swiper.js thinks the length keeps growing
        //     $scope.spheredata.topics.length = 0;
        //     return get_topic_items(topic_ctx, is_channel).then(function(items) {
        //         $scope.spheredata.topics = format_topic_items_simple(items);
        //     });
        // },
        // set_current_topic = function(idx, set_index, is_channel) {
        //     $scope.topicItems.length = 0;
        //     $scope.currentTopic = $scope.spheredata.topics[idx];
        //     if (set_index) {
        //         $scope.currentTopicIdx = idx;
        //     }
        //     get_topic_items($scope.spheredata.topics[idx].id, is_channel).then(function() {
        //         $scope.topicItems = $scope.topics[$scope.currentTopic.id];
        //     });
        // },
        // update_current_topic = function(idx, is_channel) {
        //     $scope.topicItems.length = 0;
        //     $scope.currentTopic = $scope.main_topics[idx];
        //     get_topic_items($scope.main_topics[idx].id, is_channel).then(function() {
        //         $scope.topicItems = $scope.topics[$scope.main_topics[idx].id];
        //         $scope.currentStory = null;
        //     });
        //     get_discussion_items($scope.main_topics[idx].id).then(function() {
        //       $scope.currentTopicDiscussions = $scope.topic_discussions[$scope.main_topics[idx].id];
        //     });
        // },
        // restore_topic_list = function() {
        //     $scope.$apply(function() {
        //         $scope.spheredata.topics.length = 0;
        //         $scope.spheredata.topics = [];
        //         angular.copy($scope.main_topics, $scope.spheredata.topics);
        //         $scope.spheredata.topics.shift();
        //         $scope.topicItems.length = 0;
        //         $scope.currentTopic = $scope.spheredata.topics[0];
        //         $scope.currentTopicIdx = -1;
        //         get_topic_items($scope.spheredata.topics[0].id).then(function() {
        //             $scope.topicItems = $scope.topics[$scope.currentTopic.id];
        //             $scope.currentStory = null;
        //         });
        //     });
        //
        // },
        // get_discussion_items = function(topic) {
        //     return DiscussionItems.get(topic).then(function(d) {
        //         $scope.topic_discussions[topic] = d.items;
        //     }).then(function() {
        //         return $scope.topic_discussions[topic];
        //     });
        // },
        // set_current_discussions = function(topic) {
        //   $scope.spheredata.topics.length = 0;
        //   return get_discussion_items(topic).then(function(items) {
        //       if ($scope.topic_discussions[topic]) {
        //         $scope.spheredata.topics = format_discussion_items_simple(items);
        //         ChooserData.active_discussion = 0;
        //         $scope.currentDiscussion = format_discussion_item(items[0]);
        //         if ($scope.currentDiscussion) {
        //           ForumData.change_context(topic, $scope.currentDiscussion.id);
        //         }
        //       }
        //       // $timeout lets the swiper get reloaded before reswiping
        //       $timeout(function() {
        //         $scope.topicSwiper.swipeTo(0, 0, false);
        //       }, 0);
        //   });
        // },
        // slide_to_channel_item = function(items) {
        //   var storyidx = 0;
        //   angular.forEach(items, function(item, idx) {
        //     if (item[0]['_id'] == $state.params.story) {
        //       storyidx = idx;
        //     }
        //   });
        //   return storyidx;
        // },
        // load_participants = function(ctx) {
        //   Participants.get(ctx).then(function(data) {
        //     $scope.spheredata.topics.length = 0;
        //     $scope.spheredata.topics = data.participants;
        //     $scope.thisuser = data.participants[0];
        //     $timeout(function() {
        //       ChooserData.active_slide = 0;
        //       $compile(ChooserData.tswiper)($scope);
        //     }, 0);
        //   });
        // },
        // load_curators = function(ctx) {
        //   Curators.get(ctx).then(function(data) {
        //     $scope.spheredata.topics.length = 0;
        //     $scope.spheredata.topics = data.curators;
        //     $scope.thisuser = data.curators[0];
        //     $timeout(function() {
        //       ChooserData.active_slide = 0;
        //       $compile(ChooserData.tswiper)($scope);
        //     }, 0);
        //   });
        // },
        // load_resources = function(ctx) {
        //   Resources.get(ctx).then(function(data) {
        //     $scope.spheredata.topics.length = 0;
        //     $scope.resource_items = data.items;
        //     $scope.spheredata.topics = format_resource_items_simple(data.items);
        //     $scope.thisresource = format_resource_item(data.items[0]);
        //     $timeout(function() {
        //       ChooserData.active_slide = 0;
        //       $compile(ChooserData.tswiper)($scope);
        //     }, 0);
        //   });
        // },
        // get_item_index = function(items, item_id) {
        //   var item_index = 0;
        //   angular.forEach(items, function(item, idx) {
        //     if (item_id == item[0]['_id']) {
        //       item_index = idx;
        //       return;
        //     } else {
        //       // TODO: ask server to lookup item and add it to the front of the chooser
        //       //       in case it's in a downrange page.
        //     }
        //   });
        //   return item_index;
        // };

    }]);
