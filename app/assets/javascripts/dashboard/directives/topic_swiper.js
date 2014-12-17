/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalApp.TopicSwiperDirectives', [])
.directive('topicSwiper', ['SPHR_HST', 'ActivityVis', 'ChooserData', function(SPHR_HST, ActivityVis,ChooserData) {
    return {
        restrict: 'A',
        scope: {
            slidearray: '='
        },
    		controller: function ($scope, $element) {
    			this.slideWasClicked = true;
          this.parentController = $scope.$parent;
          $scope.swipe_enable = ActivityVis.swipe_enable;
          ChooserData.tswiper = $element; // to communicate with dragTarget directive
    		},
        templateUrl: SPHR_HST + "dashboard/topic_swiper",
        replace: true
    };
}])
.directive('swiperReady', ['ActivityVis', 'ChooserData', function(ActivityVis, ChooserData) {
    return {
        restrict: 'A',
		require: '^topicSwiper',
        link: function(scope, elm, attrs, topicSwiperCtrl) {
            if (scope.$last) {
                var $container = elm.closest('.swiper-container');
                if (ActivityVis.swipe_enable) {
                    topicSwiperCtrl.parentController.topicSwiper = $container.swiper({
                        onTouchStart: function() {
                            topicSwiperCtrl.slideWasClicked = true;
                        },
                        onTouchMove: function() {
                            topicSwiperCtrl.slideWasClicked = false;
                        },
                        onTouchEnd: function(e) {
                            if (ActivityVis.discussions) {
                              ChooserData.active_discussion = e.activeSlide;
                            } else if (ActivityVis.stories) {
                              ChooserData.active_slide = e.activeSlide;
                            }
                        }
                    });
                    topicSwiperCtrl.parentController.topicSwiper.swipeTo(ChooserData.active_slide,0,false);
                    if (topicSwiperCtrl.parentController.openDash) {
                        jQuery('#spherical_dashboard_container').show('blind', 1500);
                    }
                }
            }
        }
    };
}])
.directive('slideSelect', ['ActivityVis', 'ChooserData', function(ActivityVis, ChooserData) {
	return {
		restrict: 'A',
		require: '^topicSwiper',
        link: function(scope, elm, attrs, topicSwiperCtrl) {
    			elm.on('click', function() {
            var this_index = parseInt(scope.$index),
            current_topic = topicSwiperCtrl.parentController.currentTopic;
            ActivityVis.noslides = false;
            jQuery('.swiper-entity', '.topic-swiper').removeClass('unhighlight');
            scope.$apply(function() {
              ActivityVis.shareitem = false;
            });
            if (topicSwiperCtrl.slideWasClicked && attrs.itemtype == 'topic') {
                topicSwiperCtrl.parentController.slide_select(this_index, attrs.id);
                scope.$apply(function() {
                  ActivityVis.stories = true;
                });
            } else if (topicSwiperCtrl.slideWasClicked && attrs.itemtype == 'story') {
                // itemSwiper is defined in the itemSwiperReady directive,
                // on the parent controller of its and this controller, i.e. MainCtrl
                 topicSwiperCtrl.parentController.itemSwiper.swipeTo(this_index,500,false);
                topicSwiperCtrl.parentController.state.go(
                    'sphere.topic.story', {topic: current_topic.name, story: attrs.id}
                );
                scope.$apply(function() {
                  ActivityVis.stories = true;
                });
            } else if (topicSwiperCtrl.slideWasClicked && attrs.itemtype == 'discussion') {
              scope.$apply(function() {
                topicSwiperCtrl.parentController.load_current_discussion(this_index);
                ActivityVis.discussions = true;
              });
              topicSwiperCtrl.parentController.state.go(
                  'sphere.topic.discussion', {topic: current_topic.name, discussion: attrs.id}
              );
            } else if (topicSwiperCtrl.slideWasClicked && attrs.itemtype == 'profile') {
              scope.$apply(function() {
                topicSwiperCtrl.parentController.load_profile(this_index);
              });
            }
    			});
      }
  };
}]);
