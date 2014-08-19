/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalApp.DiscussionDirectives', [])
.directive('highlightButton', [function() {
    return {
        restrict: 'A',
        link: function(scope, elm, attrs) {
            elm.on('mouseenter', function() {
                elm.addClass('highlight');
            })
            .on('mouseleave', function() {
                elm.removeClass('highlight');
            });
        }
    };
}])
.directive('discussionDisplay', ['SPHR_HST', 'ForumData', function(SPHR_HST, ForumData) {
    return {
        restrict: 'A',
        controller: "MainForumCtrl",
        templateUrl: SPHR_HST + "tpls/discussion_display.html"
    };
}])
.directive('discussionEdit', ['SPHR_HST', 'uuid4', 'ActivityVis', 'ChooserData', function(SPHR_HST, uuid4, ActivityVis, ChooserData) {
    return {
        restrict: 'A',
        scope: {
            currenttopic: '=',
            visible: '=',
            chooserdata: '='
        },
        templateUrl: SPHR_HST + "tpls/discussion_edit.html"
    };
}])
.directive('dragTarget', ['$compile', 'ActivityVis', 'ChooserData', function($compile, ActivityVis, ChooserData) {
    return {
        restrict: 'A',
        controller: function($scope, $element) {
            $scope.handle_dragdrop = function(event, data) {
                var dup = false,
                actvtyctrl = $scope.$parent;
                angular.forEach(ChooserData.citations, function(citation) {
                    if (citation.id == data.id) {
                        dup = true;
                    }
                });
                if (!dup) {
                    ChooserData.citations.push(data);
                }
                ActivityVis.show_drag_target = false;
                ActivityVis.swipe_enable = true;
                ChooserData.thispost_disabled = false;
                $compile(ChooserData.tswiper)(actvtyctrl);
                $element.parent().removeClass('on-drag-hover');
            };
        },
        link: function(scope, elm, attrs) {
            var actvtyctrl = scope.$parent;
            elm.on('click', function() {
                var tswidth = ChooserData.tswiper.children().width() + 'px',
                tspos = ChooserData.tswiper.children().position().left + 'px';
                if (ActivityVis.show_drag_target) {
                    scope.$apply(function() {
                        ActivityVis.show_drag_target = false;
                        ActivityVis.swipe_enable = true;
                        ChooserData.thispost_disabled = false;
                        $compile(ChooserData.tswiper)(actvtyctrl);
                    });
                } else {
                    scope.$apply(function(scope) {
                        ActivityVis.show_drag_target = true;
                        ActivityVis.swipe_enable = false;
                        ChooserData.thispost_disabled = true;
                        $compile(ChooserData.tswiper)(actvtyctrl);
                    });
                    ChooserData.tswiper.children().css({width: tswidth, marginLeft: tspos});
                }
            });
        }
    };
}])
.directive('citeDelete', ['ChooserData', function(ChooserData) {
    return {
        restrict: 'A',
        scope: {
            idx: '='
        },
        link: function(scope, elm, attrs) {
            elm.on('click', function() {
                scope.$apply(function() {
                    ChooserData.citations.splice(scope.idx, 1);
                });
                $('#preview_text').find('p').last().append(' '); // reflow text
            });
        }
    };
}])
.directive('saveThispost', ['$http', '$timeout', 'uuid4', 'SPHR_HST', 'ActivityVis', 'ChooserData', function($http, $timeout, uuid4,  SPHR_HST, ActivityVis, ChooserData) {
    return {
        restrict: 'A',
        link: function(scope, elm, attrs) {
            var data = {},
            actvtyctrl = scope.$parent;
            elm.on('click', function() {
                if (/[\w]+/.test(scope.post_title) && /[\w]+/.test(scope.post_text) && !scope.deactivate) {
                    scope.deactivate = true;
                    data.title = scope.post_title;
                    data.content = angular.element('#preview_text').html();
                    data.citations = ChooserData.citations.map(function(cite) {
                        return cite.id;
                    });
                    data.topic = scope.currenttopic;
                    data.uid = uuid4.generate();
                    $http.post(SPHR_HST + "forum_persistence/save_conversation_post", angular.toJson(data))
                    .success(
                        function(resp) {
                            actvtyctrl.refresh_conversations();
                            scope.post_title = '';
                            scope.post_text = '';
                            ChooserData.citations = [];
                            scope.deactivate = false;
                            $timeout(function() {
                              actvtyctrl.topicSwiper.swipeTo(0, 0, false);
                            }, 100);
                        }
                    )
                    .error(
                        function(resp, status) {
                            console.log('error: ' + status);
                            scope.deactivate = false;
                        }
                    );
                }
            });
        }
    };
}])
.directive('commentOc', ['ForumData', function(ForumData) {
    return {
        restrict: 'A',
        link: function(scope, elm, attrs, ctrl) {
            elm.on('click', function() {
                if (!ForumData.form_visible) {
                    scope.$apply(function() {
                        ForumData.form_visible = true;
                    });
                    elm.html('Close');
                } else {
                    scope.$apply(function() {
                        ForumData.form_visible = false;
                    });
                    elm.html('Comment');
                }
            });
        }
    };
}])
.directive('postAuthorImage', ['SPHR_HST', function(SPHR_HST) {
    return {
        restrict: 'A',
        scope: {
            imgaddr: '='
        },
        templateUrl: SPHR_HST + "tpls/profile_pic.html",
        transclude: true,
        controller: function ($scope) {
            $scope.addr = SPHR_HST + "assets/nopic.png";
            if (/^\/uploads\/entity\/profile_pic/.test($scope.imgaddr)) {
                //remove leading '/'
                $scope.addr = SPHR_HST + $scope.imgaddr.substring(1);
            } else if (/^https?:\/\//.test($scope.imgaddr)) {
                $scope.addr = $scope.imgaddr;
            }
        }
    };
}]);
