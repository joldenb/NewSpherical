'use strict';

angular.module('sphericalApp.TopicSwiperDirectives', [])
.directive('topicSwiper', ['SPHR_HST', function(SPHR_HST) {
    return {
        restrict: 'A',
        scope: {
            slidearray: '='
        },
		controller: function ($scope) {
			this.slideWasClicked = true;
            this.parentController = $scope.$parent;
		},
        templateUrl: SPHR_HST + "dashboard/topic_swiper",
        replace: true
    }
}])
.directive('swiperReady', [function() {
    return {
        restrict: 'A',
		require: '^topicSwiper',
        link: function(scope, elm, attrs, topicSwiperCtrl) {
            if (scope.$last) {
                var $container = elm.closest('.swiper-container');
                topicSwiperCtrl.parentController.topicSwiper = $container.swiper({
                    onTouchStart: function() {
                        topicSwiperCtrl.slideWasClicked = true;
                    },
                    onTouchMove: function() {
                        topicSwiperCtrl.slideWasClicked = false;
                    },
                    onTouchEnd: function(e) {
                        //console.log(e.activeSlide);
                    }
                });
                topicSwiperCtrl.parentController.topicSwiper.swipeTo(0,0,false);
                if (topicSwiperCtrl.parentController.openDash) {
                    $('#spherical_dashboard_container').show('slow');
                }
            }
        }
    }
}])
.directive('slideSelect', [function() {
	return {
		restrict: 'A',
		require: '^topicSwiper',
        link: function(scope, elm, attrs, topicSwiperCtrl) {
			elm.on('click', function() {
                var this_index = parseInt(scope.$index);
                if (topicSwiperCtrl.slideWasClicked && attrs.itemtype == 'topic') {
                    topicSwiperCtrl.parentController.slide_select(this_index, attrs.id);
                } else if (topicSwiperCtrl.slideWasClicked && attrs.itemtype == 'story') {
                    // itemSwiper is defined in the itemSwiperReady directive,
                    // on the parent controller of its and this controller, i.e. MainCtrl
                    topicSwiperCtrl.parentController.itemSwiper.swipeTo(this_index,500,false);
                    topicSwiperCtrl.parentController.state.go(
                        'home.topic.story', {story: attrs.id}
                    );
                }
			});
        }
	}
}])
.directive('topicCntrlBtn', [function() {
    return {
        restrict: 'A',
        scope: {
            btntarget: '@'
        },
        link: function(scope, elm, attrs) {
            var mainController = scope.$parent,
            all = function() {
                var topic_index = mainController.currentTopicIdx;
                if (topic_index >= 0) {
                    mainController.restore_topic_list();
                }
            },
            previous = function() {
                var topic_index = mainController.currentTopicIdx;
                if (topic_index > 0) {
                    previous_topic_index = topic_index - 1;
                    mainController.adjacent_topic(previous_topic_index);
                }
            },
            next = function() {
                var topic_index = mainController.currentTopicIdx;
                if (topic_index < mainController.spheredata.num_topics-1 && topic_index >= 0) {
                    next_topic_index = topic_index + 1;
                    mainController.adjacent_topic(next_topic_index);
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
    }
}]);
