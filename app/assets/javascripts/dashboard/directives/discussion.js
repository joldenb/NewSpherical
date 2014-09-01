/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
/* global toMarkdown */
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
                angular.forEach(ChooserData.thispostdata.citations, function(citation) {
                    if (citation.id == data.id) {
                        dup = true;
                    }
                });
                if (!dup) {
                    ChooserData.thispostdata.citations.push(data);
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
                    ChooserData.thispostdata.citations.splice(scope.idx, 1);
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
                if (/[\w]+/.test(ChooserData.thispostdata.description) && /[\w]+/.test(ChooserData.thispostdata.text) && !scope.deactivate) {
                    scope.deactivate = true;
                    data.title = ChooserData.thispostdata.description;
                    data.content = angular.element('#preview_text').html();
                    data.citations = ChooserData.thispostdata.citations.map(function(cite) {
                        return cite.id;
                    });
                    data.topic = scope.currenttopic;
                    data.oid = ChooserData.thispostdata.oid || uuid4.generate();
                    data.post_id = ChooserData.thispostdata.id;
                    $http.post(SPHR_HST + "forum_persistence/save_conversation_post", angular.toJson(data))
                    .success(
                        function(resp) {
                            actvtyctrl.refresh_conversations();
                            ChooserData.thispostdata = {citations:[]};
                            ChooserData.active_discussion = 0;
                            scope.deactivate = false;
                            ActivityVis.stories = false;
                            ActivityVis.discussions = true;
                            ActivityVis.discussion_edit = false;
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
.directive('editPost', ['$http', '$timeout', 'uuid4', 'SPHR_HST', 'ActivityVis', 'ChooserData', function($http, $timeout, uuid4,  SPHR_HST, ActivityVis, ChooserData) {
  return {
    restrict: 'A',
    link: function (scope, elm, attrs) {
      elm.on('click', function () {
        scope.visible.stories_active = false;
        scope.visible.discussions_active = true;

        scope.check_signin(function(signedin) {
          if (signedin && signedin.id == scope.currentDiscussion.author_id) {
            var formatted_post_data = {};
            angular.forEach(scope.currentDiscussion, function(value, key) {
              if (key == 'text') {
                formatted_post_data[key] = toMarkdown(value);
              } else {
                formatted_post_data[key] = value;
              }
            });
            ChooserData.thispostdata = formatted_post_data;
            ActivityVis.stories = false;
            ActivityVis.discussions = false;
            ActivityVis.discussion_edit = true;
          }
        });
      });
    }
  };
}])
.directive('chsrState', [function() {
  return {
      restrict: 'A',
      link: function(scope, elm, attrs) {
        var actvtyctrl = scope.$parent;
        elm.on('click', function() {
          actvtyctrl.switch_chooser(attrs.value);
        });
      }
    };
}])
.directive('commentOc', ['ForumData', function(ForumData) {
    return {
        restrict: 'A',
        controller: function ($scope) {
          $scope.form_visible = ForumData.form_visible;
        },
        link: function(scope, elm, attrs, ctrl) {
            elm.on('click', function() {
                if (!scope.form_visible) {
                    scope.$apply(function() {
                        scope.form_visible = true;
                    });
                } else {
                    scope.$apply(function() {
                        scope.form_visible = false;
                    });
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
