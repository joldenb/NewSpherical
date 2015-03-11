/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalApp.ActivityDirectives', [])
.directive('chooserClick', ['$state', '$timeout', 'ActivityVis', 'ForumData', function($state, $timeout, ActivityVis, ForumData) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      var slideidx = parseInt(attrs.index),
      itemid = attrs.itemid,
      ctxname = attrs.ctxname;
      elm.on('click', function() {
        if (attrs.itemtype == 'story') {
          scope.$apply(function() {
            scope.set_activestory(slideidx);
            scope.set_carousel_index(itemid);
            $state.go(
                'sphere.topic.story', {topic: scope.chooser.state.currentTopic, story: itemid}
            );
          });
        } else if (attrs.itemtype == 'discussion') {
          scope.$apply(function() {
            $timeout(function () {
              scope.set_active_discussion(slideidx);
              scope.set_carousel_index(itemid);
              ForumData.forum_ctx_id = scope.chooser.state.currentTopicId;
              ForumData.post_id = itemid;
              $state.go(
                  'sphere.topic.discussion', {topic: scope.chooser.state.currentTopic, discussion: itemid}
              );
              ActivityVis.activity_window = 'discussions';
            }, 0);
          });
        } else if (attrs.itemtype == 'related') {
          scope.$apply(function() {
            scope.switch_sphere(itemid, ctxname, false);
          });
        } else if (attrs.itemtype == 'resource') {
          scope.$apply(function() {
            scope.set_activeresource(slideidx);
            scope.set_carousel_index(itemid);
            // $state.go(
            //     'sphere.topic.story', {topic: scope.chooser.state.currentTopic, story: itemid}
            // );
          });
        }
      });
    }
  };
}])
.directive('storyDisplay', ['SPHR_HST', function(SPHR_HST) {
    return {
        restrict: 'A',
        scope: {
          activestory: '='
        },
        link: function(scope, elm, attrs) {
          jQuery('.story_content').perfectScrollbar({suppressScrollX: true});
        },
        templateUrl: SPHR_HST + "tpls/story_display.html"
    };
}]);
