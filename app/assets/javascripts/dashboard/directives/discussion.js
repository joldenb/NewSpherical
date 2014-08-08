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
        scope: {
            discsn: '=',
            forumposts: '='
        },
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
                ChooserData.newpost_disabled = false;
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
                        ChooserData.newpost_disabled = false;
                        $compile(ChooserData.tswiper)(actvtyctrl);
                    });
                } else {
                    scope.$apply(function(scope) {
                        ActivityVis.show_drag_target = true;
                        ActivityVis.swipe_enable = false;
                        ChooserData.newpost_disabled = true;
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