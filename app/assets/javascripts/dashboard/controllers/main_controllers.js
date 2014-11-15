/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalApp.MainControllers', [])
    .controller('MainCtrl', ['$scope', '$rootScope', '$state', '$timeout', '$http', 'SPHR_HST', 'SphereInfo', 'UserInfo', 'ActivityVis', function($scope, $rootScope, $state, $timeout, $http, SPHR_HST, SphereInfo, UserInfo, ActivityVis) {
        $scope.spheredata = {};
        SphereInfo.sphereData.then(function(d) {
            $scope.spheredata.dashlogo = d.data.dashlogo;
        });
        if ($state.includes('sphere')) {
            $scope.openDash = true;
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
    .controller('ActivityCtrl', ['$scope', '$rootScope', '$http', '$state', '$timeout', '$compile', '$window', 'SphereInfo', 'TopicItems', 'UserInfo', 'Participants', 'Curators', 'ActivityVis', 'ChooserData', 'DiscussionItems', 'ForumData', 'SPHR_HST', function($scope, $rootScope, $http, $state, $timeout, $compile, $window, SphereInfo, TopicItems, UserInfo, Participants, Curators, ActivityVis, ChooserData, DiscussionItems, ForumData, SPHR_HST) {

        // these run when page loads
        SphereInfo.sphereData.then(function(d) {
            $scope.spheredata.topics = d.data.topics;
            $scope.spheredata.num_topics = d.data.topics.length;
            set_current_topic(0, false);
            return $scope.spheredata.topics;
        }).then(function(topics) {
            angular.forEach(topics, function(topic, idx) {
                $scope.main_topics.push(topic);
            });
            return topics;
        }).then(function(topics) {
            angular.forEach(topics, function(topic, idx) {
                if (topic.name == $state.params.topic) {
                    set_current_topic(idx, true);
                    get_discussion_items(topic.id).then(function(items) {
                      if (items.length > 0) {
                        $scope.currentTopicDiscussions = $scope.topic_discussions[topic.id];
                      }
                      if ($state.includes('**.discussion.**')) {
                        $scope.spheredata.topics = format_discussion_items_simple(items);
                        var discussion_index = get_item_index(items, $state.params.discussion);
                        ChooserData.active_discussion = discussion_index;
                        $scope.currentDiscussion = format_discussion_item(items[discussion_index]);
                        $scope.current_discussion = $scope.topic_discussions[$scope.currentTopic.id][discussion_index];
                        ForumData.change_context($scope.currentTopic.id, $scope.current_discussion[0]['_id']);
                        ActivityVis.stories = false;
                        ActivityVis.discussions = true;
                        ActivityVis.discussions_active = true;
                        ActivityVis.stories_active = false;
                        $timeout(function () {
                          $scope.topicSwiper.swipeTo(discussion_index - 1, 0, false);
                        },0);
                    } else {
                        switch_topics(topic.id);
                        if ($state.includes('**.story')) {
                          $scope.currentStory = $state.params.story;
                          ActivityVis.discussions_active = false;
                          ActivityVis.stories_active = true;
                        }
                      }
                    });
                    $scope.topicIndicatorVisible = true;
                    $scope.$parent.openDash = true;
                }
            });
        });

        $scope.check_signin(function(signedin) {
          ActivityVis.signedin = signedin;
        });

        // runs on state change
        $rootScope.$on('$stateChangeStart',
           function(event, toState, toParams, fromState, fromParams) {
               if (toParams.story) {
                 $scope.currentStory = toParams.story;
               }
           }
        );

        // $scope vars
        $scope.ctrlname = 'ActivityCtrl';
        $scope.visible = ActivityVis; //used in home.html for ng-show and ng-class
        $scope.chooserdata = ChooserData;
        $scope.spheredata = {};
        $scope.currentTopic = {};
        $scope.currentTopicIdx = -1;
        $scope.main_topics = [];
        $scope.topics = {};
        $scope.topic_discussions = {};
        $scope.topicItems = {};
        $scope.topicIndicatorVisible = false;
        $scope.state = $state;
        $scope.sphr_hst = SPHR_HST;
        $scope.thiswindow = $window;
        // $scope functions
        $scope.activityShow = function(show) {
            $scope.visible.shareitem = false;
            $scope.visible.noslides = false;
            if (show == 'discussions') {
                ActivityVis.stories = false;
                ActivityVis.discussions = false;
                ActivityVis.discussion_edit = false;
                ActivityVis.discussions_active = true;
                ActivityVis.stories_active = false;
                ActivityVis.curators = false;
                ActivityVis.participants = false;
                set_current_discussions($scope.currentTopic.id);
                if ($scope.topic_discussions[$scope.currentTopic.id] && $scope.topic_discussions[$scope.currentTopic.id].length > 0) {
                  $scope.current_discussion = $scope.topic_discussions[$scope.currentTopic.id][0];
                  ForumData.change_context($scope.currentTopic.id, $scope.current_discussion[0]['_id']);
                  $state.go('sphere.topic.discussion', {discussion: $scope.currentTopicDiscussions[0][0]['_id']});
                  $timeout(function () {
                    ActivityVis.discussions = true;
                  }, 500); //otherwise flashes the previously loaded discussion
                } else {
                  if (ActivityVis.signedin) {
                    ActivityVis.discussion_edit = true;
                  }
                  ActivityVis.noslides = "No Discussions Yet";
                }
            } else if (show == 'stories') {
                ActivityVis.stories = true;
                ActivityVis.discussions = false;
                ActivityVis.discussion_edit = false;
                ActivityVis.discussions_active = false;
                ActivityVis.stories_active = true;
                ActivityVis.curators = false;
                ActivityVis.participants = false;
                switch_topics($scope.currentTopic.id);
                if ($scope.currentStory) {
                    $state.go(
                        'sphere.topic.story', {topic: $scope.currentTopic.name, story: $scope.currentStory}
                    );
                } else if ($state.includes('**.topic.**')) {
                   $state.go(
                       'sphere.topic', {topic: $scope.currentTopic.name}
                   );
                }
            } else if (show == 'participants') {
               load_participants();
               ActivityVis.discussions = false;
               ActivityVis.discussion_edit = false;
               ActivityVis.stories = false;
               ActivityVis.curators = false;
               ActivityVis.participants = true;
            } else if (show == 'curators') {
               load_curators();
               ActivityVis.discussions = false;
               ActivityVis.discussion_edit = false;
               ActivityVis.stories = false;
               ActivityVis.curators = true;
               ActivityVis.participants = false;
            }
        };
        $scope.visible.itemctls = function() {
            if ($scope.visible.signedin && $state.includes('**.topic.*')) {
                return true;
            } else {
                return false;
            }
        };
        $scope.visible.topicctls = function() {
            if ($scope.visible.signedin && $state.includes('**.topic.**')) {
                return true;
            } else {
                return false;
            }
        };
        $scope.switch_chooser = function(chooser_state) {
          if (chooser_state == 'discussions') {
            set_current_discussions($scope.currentTopic.id);
            $scope.topicSwiper.swipeTo(ChooserData.active_discussion, 0, false);
            ActivityVis.discussions_active = true;
            ActivityVis.stories_active = false;
          } else if (chooser_state == 'stories') {
            switch_topics($scope.currentTopic.id);
            $scope.topicSwiper.swipeTo(ChooserData.active_slide, 0, false);
            ActivityVis.discussions_active = false;
            ActivityVis.stories_active = true;
          }
        };
        $scope.slide_select = function(slide_index, slide_id, current_story_id) {
            set_current_topic(slide_index, true);
            switch_topics(slide_id);
            get_discussion_items(slide_id).then(function(items) {
              if (items.length > 0) {
                $scope.currentTopicDiscussions = $scope.topic_discussions[slide_id];
              }
            });
            $scope.$apply(function() {
                $scope.topicIndicatorVisible = true;
            });
            if (current_story_id) {
                $scope.current_story_id = current_story_id;
                $state.go(
                    'sphere.topic.story', {topic: $scope.currentTopic.name, story: current_story_id}
                );
            } else {
               $state.go(
                   'sphere.topic', {topic: $scope.currentTopic.name}
               );
            }
        };
        $scope.restore_topic_list = function() {
            restore_topic_list();
            $scope.visible.shareitem = false;
            $scope.$apply(function() {
                $scope.topicIndicatorVisible = false;
                ActivityVis.noslides = false;
                ActivityVis.stories = true;
                ActivityVis.discussions = false;
                ActivityVis.discussion_edit = false;

                ActivityVis.show_drag_target = false;
                ActivityVis.swipe_enable = true;
                ChooserData.thispost_disabled = false;
                ChooserData.active_slide = 0;
                $compile(ChooserData.tswiper)($scope);
            });
            // $scope.topicSwiper is instantiated by the swiperReady directive
            $scope.topicSwiper.init();
            $state.go(
                'sphere'
            );
        };
        $scope.adjacent_topic = function(adjacent_topic_index) {
            $scope.visible.shareitem = false;
            $scope.$apply(function() {
                ActivityVis.stories = true;
                ActivityVis.discussions = false;
                ActivityVis.discussion_edit = false;

                ActivityVis.show_drag_target = false;
                ActivityVis.swipe_enable = true;
                ChooserData.thispost_disabled = false;
                ChooserData.active_slide = 0;
                $compile(ChooserData.tswiper)($scope);
            });
            switch_topics($scope.main_topics[adjacent_topic_index].id);
            $scope.currentTopicIdx = adjacent_topic_index;
            update_current_topic(adjacent_topic_index);
            get_discussion_items($scope.main_topics[adjacent_topic_index].id);
            // $scope.topicSwiper and $scope.itemSwiper are instantiated by the swiperReady
            // and itemSwiperReady directives
            $scope.topicSwiper.init();
            $scope.itemSwiper.init();
            $state.go(
                'sphere.topic', {topic: $scope.currentTopic.name}
            );
        };
        $scope.slide_to_item = function() {
            if ($state.params.story) {
                angular.forEach($scope.topics[$scope.currentTopic.id], function(item, idx) {
                    if (item[0]['_id'] == $state.params.story) {
                        $scope.itemSwiper.swipeTo(idx, 0, false);
                        if (idx > 1) {
                            $timeout(function() {
                                try{
                                    $scope.topicSwiper.swipeTo(idx - 1, 0, false);
                                    ChooserData.active_slide = idx - 1;
                                }
                                catch(e){
                                    //suppress error if $scope.topicSwiper was null
                                }
                            }, 500);
                        }
                    }
                });
            } else if($state.params.discussion) {
              //todo
            }  else {
                $scope.itemSwiper.swipeTo(0, 0, false);
                ChooserData.active_slide = 0;
            }
        };
        $scope.refresh_conversations = function() {
          get_discussion_items($scope.currentTopic.id).then(function() {
            $scope.currentTopicDiscussions = $scope.topic_discussions[$scope.currentTopic.id];
            set_current_discussions($scope.currentTopic.id);
            $scope.current_discussion = $scope.topic_discussions[$scope.currentTopic.id][0];
            ForumData.change_context($scope.currentTopic.id, $scope.current_discussion[0]['_id']);
          });
        };
        $scope.load_current_discussion = function(idx) {
          $scope.current_discussion = $scope.topic_discussions[$scope.currentTopic.id][idx];
          $scope.currentDiscussion = format_discussion_item($scope.current_discussion);
          ChooserData.active_discussion = idx;
          ForumData.change_context($scope.currentTopic.id, $scope.current_discussion[0]['_id']);
        };
        $scope.load_profile = function(idx) {
          $scope.thisuser = $scope.spheredata.topics[idx];
        };
        $scope.get_item_index = function(items, item_id) {
          return get_item_index(items, item_id);
        };
        $scope.invite_role = 'participant';
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
            console.log(data);

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
        $scope.elevation_result = {};
        $scope.elevateItem = function(item_id, mode) {
          var data = {item_id: item_id},
          idx = 0;
          $http.post(SPHR_HST + 'topics/elevate_item', data)
          .success(function(res, status) {
            if (res.success) {
              if (mode === 'discussions') {
                set_current_discussions($scope.currentTopic.id);
              } else {
                switch_topics($scope.currentTopic.id);
              }
              update_current_topic($scope.currentTopicIdx);
              set_current_discussions($scope.currentTopic);

            }
            $scope.elevation_result = res;
            $timeout(function () {
              $scope.elevation_result = {};
              var newidx = get_item_index($scope.topics[$scope.currentTopic.id], item_id);
              if (newidx > 1) {
                  $scope.topicSwiper.swipeTo(newidx - 1, 300, false);
                  ChooserData.active_slide = newidx - 1;
              } else {
                  $scope.topicSwiper.swipeTo(0, 300, false);
                  ChooserData.active_slide = 0;
              }
            }, 2000);
          });
        };

        // private functions
        var format_topic_items_simple = function(items) {
            var formatted = [];
            angular.forEach(items, function(value) {
                var item = {};
                item.id = value[0]['_id'];
                item.pic = value[0]['image_src'];
                item.description = value[0]['headline'];
                item.article_uri = value[0]['article_uri'];
                item.elevation = value[1];
                item.itemtype = 'story';
                formatted.push(item);
            });
            return formatted;
        },
        format_discussion_items_simple = function(items) {
            var formatted = [];
            angular.forEach(items, function(value) {
                var item = {};
                item.id = value[0]['_id'];
                item.description = value[0]['headline'];
                item.pubdate = value[2]['pubdate'];
                item.elevation = value[1];
                item.itemtype = 'discussion';
                item.author = value[2]['author_handle'];
                item.thumbnail = value[2]['thumb'];
                formatted.push(item);
            });
            return formatted;
        },
        format_discussion_item = function(item) {
          if (!angular.isArray(item)) {
            return;
          }
          var formatted = {};
          formatted.id = item[0]['_id'];
          formatted.description = item[0]['headline'];
          formatted.text = item[0]['text'];
          formatted.oid = item[0]['oid'];
          formatted.citations = item[3];
          formatted.pubdate = item[2]['pubdate'];
          formatted.elevation = item[1];
          formatted.itemtype = 'discussion';
          formatted.author = item[2]['author_handle'];
          formatted.author_id = item[0]['submitter'];
          formatted.thumbnail = item[2]['thumb'];
          return formatted;
        },
        get_topic_items = function(topic) {
            return TopicItems.get(topic).then(function(d) {
                $scope.topics[topic] = d.items;
            }).then(function() {
                return $scope.topics[topic];
            });
        },
        switch_topics = function(topic_ctx) {
            // have to do this, else swiper.js thinks the length keeps growing
            $scope.spheredata.topics.length = 0;
            get_topic_items(topic_ctx).then(function(items) {
                $scope.spheredata.topics = format_topic_items_simple(items);
            });
        },
        set_current_topic = function(idx, set_index) {
            $scope.topicItems.length = 0;
            $scope.currentTopic = $scope.spheredata.topics[idx];
            if (set_index) {
                $scope.currentTopicIdx = idx;
            }
            get_topic_items($scope.spheredata.topics[idx].id).then(function() {
                $scope.topicItems = $scope.topics[$scope.currentTopic.id];
            });
        },
        update_current_topic = function(idx) {
            $scope.topicItems.length = 0;
            $scope.currentTopic = $scope.main_topics[idx];
            get_topic_items($scope.main_topics[idx].id).then(function() {
                $scope.topicItems = $scope.topics[$scope.main_topics[idx].id];
                $scope.currentStory = null;
            });
            get_discussion_items($scope.main_topics[idx].id).then(function() {
              $scope.currentTopicDiscussions = $scope.topic_discussions[$scope.main_topics[idx].id];
            });
        },
        restore_topic_list = function() {
            $scope.$apply(function() {
                $scope.spheredata.topics.length = 0;
                angular.forEach($scope.main_topics, function(topic) {
                    $scope.spheredata.topics.push(topic);
                });
                $scope.topicItems.length = 0;
                $scope.currentTopic = $scope.spheredata.topics[0];
                $scope.currentTopicIdx = -1;
                get_topic_items($scope.spheredata.topics[0].id).then(function() {
                    $scope.topicItems = $scope.topics[$scope.currentTopic.id];
                    $scope.currentStory = null;
                });
            });

        },
        get_discussion_items = function(topic) {
            return DiscussionItems.get(topic).then(function(d) {
                $scope.topic_discussions[topic] = d.items;
            }).then(function() {
                return $scope.topic_discussions[topic];
            });
        },
        set_current_discussions = function(topic) {
          $scope.spheredata.topics.length = 0;
          get_discussion_items(topic).then(function(items) {
              if ($scope.topic_discussions[topic]) {
                $scope.spheredata.topics = format_discussion_items_simple(items);
                ChooserData.active_discussion = 0;
                $scope.currentDiscussion = format_discussion_item(items[0]);
                if ($scope.currentDiscussion) {
                  ForumData.change_context(topic, $scope.currentDiscussion.id);
                }
              }
              // $timeout lets the swiper get reloaded before reswiping
              $timeout(function() {
                $scope.topicSwiper.swipeTo(0, 0, false);
              }, 0);
          });
        },
        load_participants = function(ctx) {
          Participants.get(ctx).then(function(data) {
            $scope.spheredata.topics.length = 0;
            $scope.spheredata.topics = data.participants;
            $scope.thisuser = data.participants[0];
            $timeout(function() {
              $compile(ChooserData.tswiper)($scope);
              $scope.topicSwiper.swipeTo(0, 0, false);
            }, 0);
          });
        },
        load_curators = function(ctx) {
          Curators.get(ctx).then(function(data) {
            $scope.spheredata.topics.length = 0;
            $scope.spheredata.topics = data.curators;
            $scope.thisuser = data.curators[0];
            $timeout(function() {
              $compile(ChooserData.tswiper)($scope);
              $scope.topicSwiper.swipeTo(0, 0, false);
            }, 0);
          });
        },
        get_item_index = function(items, item_id) {
          var item_index = 0;
          angular.forEach(items, function(item, idx) {
            if (item_id == item[0]['_id']) {
              item_index = idx;
              return;
            } else {
              // TODO: ask server to lookup item and add it to the front of the chooser
              //       in case it's in a downrange page.
            }
          });
          return item_index;
        };

    }]);
