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
                var topic_index = activityController.currentTopicIdx;
                if (topic_index >= 0) {
                    activityController.restore_topic_list();
                }
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
            var newDiscussion = function() {
                if (!$state.includes('**.topic.**')) {
                    return;
                }
                var actvtyctrl = scope.$parent;
                UserInfo.signedin().then(function(d) {
                    if (d.signedin) {
                        ActivityVis.stories = false;
                        ActivityVis.discussions = false;
                        ActivityVis.discussion_edit = true;

                        ActivityVis.show_drag_target = false;
                        ActivityVis.swipe_enable = true;
                        ChooserData.thispost_disabled = false;
                        $compile(ChooserData.tswiper)(actvtyctrl);
                    }
                });
            },
            btnAction = function(btntarget) {
                switch(btntarget) {
                    case 'new_discussion':
                        newDiscussion();
                        break;
                }
            };
            elm.on('click', function() {
                btnAction(scope.btntarget);
            });
        }
    };
}]);