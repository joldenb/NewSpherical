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
      ctxname = attrs.ctxname,
      itemtype = attrs.itemtype;
      elm.on('click', function() {
        if (!scope.chooser.state.menuVisible) {
            return;
        }
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
        } else if (attrs.itemtype == 'profile') {
          scope.$apply(function() {
            scope.set_activeprofile(slideidx);
            scope.set_carousel_index(itemid);
            // $state.go(
            //     'sphere.topic.profiles', {topic: activityController.chooser.state.currentTopic, profile: itemid}
            // );
          });
        }
      });
      elm.on('dblclick', function() {
        if (ActivityVis.overlay == 'discussion_edit') {
          if ((itemtype == 'story') || (itemtype == 'discussion') || (itemtype == 'resource')) {
            scope.discussion_citation_add(itemid);
          } else {
            return;
          }
        } else {
          return;
        }
      });
    }
  };
}])
.directive('chooserMoveBack', [function() {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        var currentCarIdx = scope.carouselIndex,
        newCarIdx;
        if ((currentCarIdx - 6) > 0) {
          newCarIdx = currentCarIdx - 6;
        } else {
          newCarIdx = 0;
        }
        scope.$apply(function() {
          scope.carouselIndex = newCarIdx;
        });
      });
    }
  };
}])
.directive('chooserMoveForward', [function() {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        var currentCarIdx = scope.carouselIndex,
        newCarIdx;
        newCarIdx = currentCarIdx + 6;
        scope.$apply(function() {
          scope.carouselIndex = newCarIdx;
        });
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
        templateUrl: SPHR_HST + "tpls/story_display.html"
    };
}]);
