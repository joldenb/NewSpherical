/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalApp.ItemSwiperDirectives', [])
.directive('itemSwiper', ['SPHR_HST', function(SPHR_HST) {
    return {
        restrict: 'A',
        scope: {
            itemarray: '='
        },
        controller: function ($scope) {
            this.slideWasClicked = true;
            this.parentController = $scope.$parent;
        },
        templateUrl: SPHR_HST + "dashboard/item_swiper",
        replace: true
    };
}])
.directive('itemSwiperReady', ['ChooserData', function(ChooserData) {
    return {
        restrict: 'A',
        require: '^itemSwiper',
        link: function(scope, elm, attrs, itemSwiperCtrl) {
            if (scope.$last) {
                var $container = elm.closest('.swiper-container');
                itemSwiperCtrl.parentController.itemSwiper = $container.swiper({
                    onTouchStart: function() {
                        itemSwiperCtrl.slideWasClicked = true;
                    },
                    onTouchMove: function() {
                        itemSwiperCtrl.slideWasClicked = false;
                    },
                    onTouchEnd: function(e) {
                        var actv = e.activeSlide,
                        has_topic = itemSwiperCtrl.parentController.state.includes('sphere.topic.**'),
                        current_topic = itemSwiperCtrl.parentController.currentTopic;
                        if (actv > 1) {
                            itemSwiperCtrl.parentController.topicSwiper.swipeTo(actv - 1, 300, false);
                            ChooserData.active_slide = actv - 1;
                        } else {
                            itemSwiperCtrl.parentController.topicSwiper.swipeTo(0, 300, false);
                            ChooserData.active_slide = 0;
                        }
                        var actv_slide = angular.element(e.wrapper).children()[actv],
                        actv_slide_id = angular.element(actv_slide).children()[0].id;
                        actv_slide_id = actv_slide_id.slice(4); //remove the 'item' prefix
                        if (has_topic) {
                           itemSwiperCtrl.parentController.state.go(
                               'sphere.topic.story', {story: actv_slide_id}
                           );
                       } else {
                            itemSwiperCtrl.parentController.slide_select(0, current_topic.id, actv_slide_id);
                       }
                    }
                });
                itemSwiperCtrl.parentController.slide_to_item();
            }
        }
    };
}]);
