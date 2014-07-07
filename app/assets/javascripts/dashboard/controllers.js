/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

/* Controllers */

angular.module('sphericalApp.controllers', [])
    .controller('MainCtrl', ['$scope', '$rootScope', '$state', 'SphereInfo', function($scope, $rootScope, $state, SphereInfo) {
        $rootScope.signedin = false;
        $scope.spheredata = {};
        SphereInfo.sphereData.then(function(d) {
            $scope.spheredata.dashlogo = d.data.dashlogo;
        });
        $scope.openDash = false;
    }])
    .controller('UserCtrl', ['$scope', '$rootScope', '$state', '$timeout', 'SPHR_HST', 'ControlPanelData', function($scope, $rootScope, $state, $timeout, SPHR_HST, ControlPanelData) {
        $scope.state = $state;
        $scope.panelstate = {};
        $scope.panelstate.visible = false;
        $scope.panelstate.classes = [];
        ControlPanelData.get().then(function(d) {
            $scope.controlPanels = d.panels;
        });
        
        $rootScope.$on('$stateChangeSuccess', 
            function(event, toState, toParams, fromState, fromParams) { 
                if (!/ctrlpanel/.test(toState.name)) {
                    $scope.panelstate.classes.push('windowshade');
                    $timeout(function() {
                        $scope.panelstate.classes = [];
                        $scope.panelstate.visible = false;
                    }, 1000);
                }
            }
        );

        var expbg = '',
        set_expd_bg = function(destn) {
            angular.forEach($scope.controlPanels, function(panel) {
                if (panel.destination && panel.destination == destn) {
                    expbg = panel.expanded_bg;
                    return;
                }
            });
        }

        if ($state.includes('**.ctrlpanel.**')) {
            set_expd_bg($state.params.destination);
            $scope.panelstate.visible = true;
            $scope.panelstate.classes = ['expanded', expbg];
            $scope.$parent.openDash = true;
        } else {
            $scope.panelstate.visible = false;
            $scope.panelstate.classes = [];
        }
    }])
    .controller('ActivityCtrl', ['$scope', '$rootScope', '$state', '$timeout', 'SphereInfo', 'TopicItems', function($scope, $rootScope, $state, $timeout, SphereInfo, TopicItems) {
       
        $scope.spheredata = {};
        $scope.currentTopic = {};
        $scope.currentTopicIdx = -1;
        $scope.main_topics = [];
        $scope.topics = {};
        $scope.topicItems = {};
        $scope.topicIndicatorVisible = false;

        $scope.state = $state;
        $scope.rootScope = $rootScope;

        //$rootScope.$on('$stateChangeStart', 
        //    function(event, toState, toParams, fromState, fromParams) { 
        //        console.log(toParams);
        //        console.log(fromParams);
        //    }
        //);

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
                    switch_topics(topic.id);
                    $scope.topicIndicatorVisible = true;
                    $scope.$parent.openDash = true;
                }
            });
        });

        var format_topic_items_simple = function(items) {
            var formatted = [];
            angular.forEach(items, function(value) {
                var item = {};
                item.id = value[0]['_id'];
                item.pic = value[0]['image_src'];
                item.description = value[0]['headline'];
                item.elevation = value[1];
                item.itemtype = 'story';
                formatted.push(item);
            });
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
                });
            });

        };

        $scope.slide_select = function(slide_index, slide_id, current_story_id) {
            set_current_topic(slide_index, true);
            switch_topics(slide_id);
            $scope.$apply(function() {
                $scope.topicIndicatorVisible = true;
            });
            if (current_story_id) {
                $state.go(
                    'home.topic.story', {topic: $scope.currentTopic.name, story: current_story_id}
                );
            } else {
               $state.go(
                   'home.topic', {topic: $scope.currentTopic.name}
               ); 
            }
        };
        $scope.restore_topic_list = function() {
            restore_topic_list();
            $scope.$apply(function() {
                $scope.topicIndicatorVisible = false;
            });
            // $scope.topicSwiper is instantiated by the swiperReady directive
            $scope.topicSwiper.init();
            $state.go(
                'home'
            );
        };
        $scope.adjacent_topic = function(adjacent_topic_index) {
            switch_topics($scope.main_topics[adjacent_topic_index].id);
            $scope.currentTopicIdx = adjacent_topic_index;
            update_current_topic(adjacent_topic_index);
            // $scope.topicSwiper and $scope.itemSwiper are instantiated by the swiperReady
            // and itemSwiperReady directives
            $scope.topicSwiper.init();
            $scope.itemSwiper.init();
            $state.go(
                'home.topic', {topic: $scope.currentTopic.name}
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
                                }
                                catch(e){
                                    //suppress error if $scope.topicSwiper was null
                                }
                            }, 500);
                        }
                    }
                });
            } else {
                $scope.itemSwiper.swipeTo(0, 0, false);
            }
        };
        
        
        
        


    }]);
