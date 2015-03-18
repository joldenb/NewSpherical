/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalApp.ActivityMenusDirectives', [])
.directive('topicCntrlBtn', ['$state', '$timeout', 'ActivityVis', 'UserInfo', 'ChooserData', 'ForumData', function($state, $timeout, ActivityVis, UserInfo, ChooserData, ForumData) {
    return {
        restrict: 'A',
        scope: {
            btntarget: '@'
        },
        link: function(scope, elm, attrs) {
            var activityController = scope.$parent,
            channel = function() {
              var topic = activityController.spheredata.channelCtxId;
              scope.$apply(function() {
                activityController.get_formatted_story_items(topic, true)
                .then(function() {
                  activityController.set_activestory(0);
                  return activityController.chooser.first_item;
                })
                .then(function(storyid) {
                  activityController.set_carousel_index(storyid);
                  ActivityVis.activity_window = 'story';
                  activityController.chooser.state.currentTopic = activityController.spheredata.channelname;
                  activityController.chooser.state.currentTopicId = activityController.spheredata.channelCtxId;
                  activityController.chooser.state.topicIndicatorVisible = true;
                  activityController.chooser.state.channelActive = true;
                  $state.go(
                      'sphere'
                  );
                });
              });
            },
            stories = function() {
              var topic = activityController.chooser.state.currentTopicId,
              is_channel = activityController.chooser.state.channelActive;
              scope.$apply(function() {
                activityController.get_formatted_story_items(topic, is_channel)
                .then(function() {
                  var current_storyid;
                  if (activityController.chooser.state.activeStory) {
                    current_storyid = activityController.chooser.state.activeStory.id;
                  } else {
                    activityController.set_activestory(0);
                    current_storyid = activityController.chooser.first_item;
                  }
                  return current_storyid;
                })
                .then(function(storyid) {
                  activityController.set_carousel_index(storyid);
                  ActivityVis.activity_window = 'story';
                  activityController.chooser.state.topicIndicatorVisible = true;
                  $state.go(
                      'sphere.topic.story', {topic: activityController.chooser.state.currentTopic, story: storyid}
                  );
                });
              });
            },
            discussions = function() {
              var topic = activityController.chooser.state.currentTopicId;
              scope.$apply(function() {
                activityController.get_formatted_discussion_items(topic)
                .then(function() {
                  var current_discussionid;
                  if (activityController.chooser.state.currentDiscussion) {
                    current_discussionid = activityController.chooser.state.currentDiscussion.id;
                  } else {
                    current_discussionid = activityController.chooser.first_item;
                  }
                  return current_discussionid;
                })
                .then(function(discussionid) {
                  var idx = activityController.set_carousel_index(discussionid);
                  activityController.set_active_discussion(idx);
                  ActivityVis.activity_window = 'discussions';
                  activityController.chooser.state.topicIndicatorVisible = true;
                  ForumData.forum_ctx_id = activityController.chooser.state.currentTopicId;
                  ForumData.post_id = discussionid;
                  $state.go(
                      'sphere.topic.discussion', {topic: activityController.chooser.state.currentTopic, discussion: discussionid}
                  );
                });

              });
            },
            related = function() {
              scope.$apply(function() {
                activityController.get_related_spheres()
                .then(function() {
                  var current_related = activityController.chooser.first_item;
                  activityController.set_carousel_index(current_related);
                  activityController.chooser.state.topicIndicatorVisible = false;
                  activityController.chooser.state.channelActive = false;
                });
              });
            },
            resources = function() {
              var topic = activityController.chooser.state.currentTopicId;
              scope.$apply(function() {
                activityController.get_formatted_resource_items(topic)
                .then(function() {
                  var current_resourceid;
                  if (activityController.chooser.state.activeResource) {
                    current_resourceid = activityController.chooser.state.activeResource.id;
                  } else {
                    activityController.set_activeresource(0);
                    current_resourceid = activityController.chooser.first_item;
                  }
                  return current_resourceid;
                })
                .then(function(resourceid) {
                  activityController.set_carousel_index(resourceid);
                  ActivityVis.activity_window = 'resources';
                  activityController.chooser.state.topicIndicatorVisible = true;
                  // $state.go(
                  //     'sphere.topic.resource', {topic: activityController.chooser.state.currentTopic, resource: resourceid}
                  // );
                });
              });
            },
            curators = function() {
              //var topic = activityController.chooser.state.currentTopicId;
              // need to modify sphere_controller#curators to accept topicID
              scope.$apply(function() {
                activityController.get_curators()
                .then(function() {
                  var current_curatorid;
                  if (activityController.chooser.state.activeCurator) {
                    current_curatorid = activityController.chooser.state.activeCurator.id;
                  } else {
                    activityController.set_activecurator(0);
                    current_curatorid = activityController.chooser.first_item;
                  }
                  return current_curatorid;
                })
                .then(function(curatorid) {
                  activityController.set_carousel_index(curatorid);
                  ActivityVis.activity_window = 'curators';
                  activityController.chooser.state.topicIndicatorVisible = true;
                  // $state.go(
                  //     'sphere.topic.profiles', {topic: activityController.chooser.state.currentTopic, profile: curatorid}
                  // );
                });
              });
            },
            participants = function() {
              //var topic = activityController.chooser.state.currentTopicId;
              // need to modify sphere_controller#entities to accept topicID
              scope.$apply(function() {
                activityController.get_participants()
                .then(function() {
                  var current_participantid;
                  if (activityController.chooser.state.activeProfile) {
                    current_participantid = activityController.chooser.state.activeProfile.id;
                  } else {
                    activityController.set_activeprofile(0);
                    current_participantid = activityController.chooser.first_item;
                  }
                  return current_participantid;
                })
                .then(function(participantid) {
                  activityController.set_carousel_index(participantid);
                  ActivityVis.activity_window = 'profiles';
                  activityController.chooser.state.topicIndicatorVisible = true;
                  // $state.go(
                  //     'sphere.topic.profiles', {topic: activityController.chooser.state.currentTopic, profile: participantid}
                  // );
                });
              });
            },
            newDiscussion = function() {
              if ((!$state.includes('**.topic.**') && !activityController.channelActive)  || ActivityVis.overlay == 'shareitem') {
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
                }
              });
            },
            newResource = function() {
              if ((!$state.includes('**.topic.**') && !activityController.channelActive)  || ActivityVis.overlay == 'shareitem') {
                return;
              }
              UserInfo.signedin().then(function(d) {
                if (d.signedin) {
                  ActivityVis.overlay = 'resource_edit';
                  ActivityVis.new_edit_resource = 'New';
                }
              });
            },
            btnAction = function(btntarget) {
                switch(btntarget) {
                    case 'channel':
                      channel();
                      break;
                    case 'related':
                      related();
                      break;
                    case 'stories':
                      stories();
                      break;
                    case 'discussions':
                      discussions();
                      break;
                    case 'resources':
                      resources();
                      break;
                    case 'curators':
                      curators();
                      break;
                    case 'participants':
                      participants();
                      break;
                    case 'new_discussion':
                      newDiscussion();
                      break;
                    case 'new_resource':
                      newResource();
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
