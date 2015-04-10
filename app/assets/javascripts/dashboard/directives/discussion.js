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
.directive('discussionEdit', ['SPHR_HST', 'ActivityVis', 'ChooserData', function(SPHR_HST, ActivityVis, ChooserData) {
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
.directive('discussionEditCloseBox', ['ActivityVis', function(ActivityVis) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        scope.$apply(function() {
          ActivityVis.overlay = null;
        });
      });
    }
  };
}])
.directive('addCitation', ['ActivityVis', function(ActivityVis) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {

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
                jQuery('#preview_text').find('p').last().append(' '); // reflow text
            });
        }
    };
}])
.directive('saveThispost', ['$http', '$timeout', 'SPHR_HST', 'ActivityVis', 'ChooserData', function($http, $timeout, SPHR_HST, ActivityVis, ChooserData) {
    return {
        restrict: 'A',
        link: function(scope, elm, attrs) {
            var data = {},
            actvtyctrl = scope.$parent;
            elm.on('click', function() {
                if (/[\w]+/.test(ChooserData.thispostdata.description) && /[\w]+/.test(ChooserData.thispostdata.text)) {
                    data.title = ChooserData.thispostdata.description;
                    data.content = angular.element('#preview_text').html();
                    data.citations = ChooserData.thispostdata.citations.map(function(cite) {
                        return cite.id;
                    });
                    data.topic = scope.currenttopic;
                    data.oid = ChooserData.thispostdata.oid;
                    data.post_id = ChooserData.thispostdata.id;
                    $http.post(SPHR_HST + "forum_persistence/save_conversation_post", angular.toJson(data))
                    .success(
                        function(resp) {
                            actvtyctrl.load_discussions();
                            ChooserData.thispostdata = {citations:[]};
                            ChooserData.active_discussion = 0;
                            ActivityVis.overlay = null;
                            // scope.deactivate = false;
                            // ActivityVis.stories = false;
                            // ActivityVis.discussions = true;
                            // ActivityVis.discussion_edit = false;
                            // ActivityVis.noslides = false;
                        }
                    )
                    .error(
                        function(resp, status) {
                            console.log('error: ' + status);
                        }
                    );
                }
            });
        }
    };
}])
.directive('editPost', ['$http', '$timeout', 'SPHR_HST', 'ActivityVis', 'ChooserData', function($http, $timeout, SPHR_HST, ActivityVis, ChooserData) {
  return {
    restrict: 'A',
    link: function (scope, elm, attrs) {
      elm.on('click', function () {
        scope.visible.stories_active = false;
        scope.visible.discussions_active = true;

        scope.check_signin(function(signedin) {
          if (signedin && signedin.id == scope.chooser.state.currentDiscussion.author_id) {
            var formatted_post_data = {};
            angular.forEach(scope.chooser.state.currentDiscussion, function(value, key) {
              if (key == 'text') {
                formatted_post_data[key] = toMarkdown(value);
              } else {
                formatted_post_data[key] = value;
              }
            });
            ChooserData.thispostdata = formatted_post_data;
            ActivityVis.overlay = 'discussion_edit';
          }
        });
      });
    }
  };
}])
// .directive('chsrState', [function() {
//   return {
//       restrict: 'A',
//       link: function(scope, elm, attrs) {
//         var actvtyctrl = scope.$parent;
//         elm.on('click', function() {
//           actvtyctrl.switch_chooser(attrs.value);
//         });
//       }
//     };
// }])
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
