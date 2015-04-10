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
                  activityController.chooser.state.itemVisible = true;
                  activityController.chooser.state.channelActive = true;
                  activityController.chooser.state.relatedActive = false;
                  $state.go(
                      'sphere'
                  );
                });
              });
            },
            stories = function() {
              scope.$apply(function() {
                activityController.load_stories();
              });
            },
            discussions = function() {
              scope.$apply(function() {
                activityController.load_discussions();
              });
            },
            related = function() {
              scope.$apply(function() {
                activityController.get_related_spheres()
                .then(function() {
                  var current_related = activityController.chooser.first_item;
                  activityController.set_carousel_index(current_related);
                  activityController.chooser.state.topicIndicatorVisible = false;
                  if ($state.params.topic && ($state.params.topic != activityController.spheredata.channelname)) {
                    activityController.chooser.state.channelActive = false;
                  }
                  activityController.chooser.state.relatedActive = true;
                });
              });
            },
            resources = function() {
              scope.$apply(function() {
                activityController.load_resources();
                activityController.chooser.state.itemVisible = true;
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
                  activityController.chooser.state.itemVisible = false;
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
                  activityController.chooser.state.itemVisible = false;
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
              if (!activityController.itemctls()) {
                return;
              }
              var current_item, headline;
              if (ActivityVis.activity_window == 'discussions') {
                current_item = activityController.chooser.state.currentDiscussion;
                headline = current_item.description;
              } else if (ActivityVis.activity_window == 'story') {
                current_item = activityController.chooser.state.activeStory;
                headline = current_item.description;
              } else if (ActivityVis.activity_window == 'resources') {
                current_item = activityController.chooser.state.activeResource;
                headline = current_item.resource_name;
              }
              jQuery('.slide', '.chooser').addClass('lowlight');
              jQuery('#' + current_item.id).removeClass('lowlight');
              scope.$apply(function() {
                activityController.current_headline = headline;
                ActivityVis.overlay = 'shareitem';
                activityController.share_message = '';
                activityController.chooser.state.menuVisible = false;
              });
            },
            elevate = function() {
              if (!activityController.itemctls()) {
                return;
              }
              var current_item, current_mode;
              if (ActivityVis.activity_window == 'discussions') {
                current_item = activityController.chooser.state.currentDiscussion.id;
                current_mode = 'discussions';
              } else if (ActivityVis.activity_window == 'story') {
                current_item = activityController.chooser.state.activeStory.id;
                current_mode = 'stories';
              } else if (ActivityVis.activity_window == 'resources') {
                current_item = activityController.chooser.state.activeResource.id;
                current_mode = 'resources';
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
