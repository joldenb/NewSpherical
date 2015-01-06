/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalApp.ControlBarDirectives', [])
.directive('topicCntrlBtn', [function() {
    return {
        restrict: 'A',
        scope: {
            btntarget: '@'
        },
        link: function(scope, elm, attrs) {
            var activityController = scope.$parent,
            previous_topic_index,
            next_topic_index,
            all = function() {
              activityController.restore_topic_list();
            },
            channel = function() {
              activityController.channeltopic();
            },
            previous = function() {
                var topic_index = activityController.currentTopicIdx;
                if (topic_index > 0) {
                    previous_topic_index = topic_index - 1;
                    activityController.adjacent_topic(previous_topic_index);
                }
            },
            next = function() {
                var topic_index = activityController.currentTopicIdx;
                if (topic_index < activityController.spheredata.num_topics-1 && topic_index >= 0) {
                    next_topic_index = topic_index + 1;
                    activityController.adjacent_topic(next_topic_index);
                }
            },
            btnAction = function(btntarget) {
                switch(btntarget) {
                    case 'all':
                        all();
                        break;
                    case 'channel':
                      channel();
                      break;
                    case 'previous':
                        previous();
                        break;
                    case 'next':
                        next();
                        break;
                }
            };
            elm.on('click', function() {
                btnAction(scope.btntarget);
            });
        }
    };
}])
.directive('cntrlbarBtn', ['$compile', '$state', 'ActivityVis', 'UserInfo', 'ChooserData', function($compile, $state, ActivityVis, UserInfo, ChooserData) {
    return {
        restrict: 'A',
        scope: {
            btntarget: '@'
        },
        link: function(scope, elm, attrs) {
            var activityController = scope.$parent,
            newDiscussion = function() {
                if (!$state.includes('**.topic.**')  || ActivityVis.shareitem) {
                    return;
                }
                UserInfo.signedin().then(function(d) {
                    if (d.signedin) {
                        ActivityVis.stories = false;
                        ActivityVis.discussions = false;
                        ActivityVis.overlay = 'discussion_edit';

                        ActivityVis.show_drag_target = false;
                        ActivityVis.swipe_enable = true;
                        ChooserData.thispostdata = {citations:[]};
                        if (ChooserData.thispost_disabled) {
                          ChooserData.thispost_disabled = false;
                          $compile(ChooserData.tswiper)(activityController);
                        }

                    }
                });
            },
            share = function() {
              if (!ActivityVis.itemctls()) {
                return;
              }
              var item_index = activityController.get_item_index(activityController.topicItems, activityController.currentStory),
              is_discussion = (ActivityVis.activity_window == 'discussions');
              jQuery('.swiper-entity', '.topic-swiper').addClass('unhighlight');
              jQuery('#' + activityController.currentStory).removeClass('unhighlight');
              if (activityController.currentDiscussion) {
                jQuery('#' + activityController.currentDiscussion.id).removeClass('unhighlight');
              }
              if (is_discussion) {
                item_index = activityController.get_item_index(activityController.topicItems, activityController.currentDiscussion.id);
              }
              scope.$apply(function() {
                ActivityVis.stories = false;
                ActivityVis.discussions = false;
                ActivityVis.discussion_edit = false;
                ActivityVis.overlay = 'shareitem';
                ActivityVis.current_item_index = item_index;
                activityController.share_message = '';
                if (is_discussion) {
                  activityController.current_headline = activityController.current_discussion[0].headline;
                } else
                activityController.current_headline = activityController.topicItems[ActivityVis.current_item_index][0].headline;
              });
              activityController.topicSwiper.swipeTo(item_index - 1, 300, false);
            },
            elevate = function() {
              if (!ActivityVis.itemctls()) {
                return;
              }
              var current_item, current_mode;
              if (ActivityVis.discussions) {
                current_item = activityController.currentDiscussion.id;
                current_mode = 'discussions';
              } else {
                current_item = activityController.currentStory;
                current_mode = 'stories';
              }
              activityController.elevateItem(current_item, current_mode);
            },
            btnAction = function(btntarget) {
                switch(btntarget) {
                    case 'new_discussion':
                        newDiscussion();
                        break;
                    case 'share':
                        share();
                        break;
                    case 'elevate':
                        elevate();
                        break;
                }
            };
            elm.on('click', function() {
                btnAction(scope.btntarget);
            });
        }
    };
}]);
