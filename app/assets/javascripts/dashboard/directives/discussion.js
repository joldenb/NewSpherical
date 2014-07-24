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
        controller: function($scope) {
            $scope.forum = ForumData;
        },
        templateUrl: SPHR_HST + "tpls/discussion_display.html"
    };
}])
.directive('discussionEdit', ['SPHR_HST', 'uuid4', function(SPHR_HST, uuid4) {
    return {
        restrict: 'A',
        scope: {
            currenttopic: '='
        },
        controller: function($scope) {
            
        },
        templateUrl: SPHR_HST + "tpls/discussion_edit.html"
    };
}])
.directive('cntrlbarBtn', ['ActivityVis', 'UserInfo', function(ActivityVis, UserInfo) {
    return {
        restrict: 'A',
        scope: {
            btntarget: '@'
        },
        link: function(scope, elm, attrs) {
            var newDiscussion = function() {
                console.log('start a new discussion!');
                UserInfo.signedin().then(function(d) {
                    if (d.signedin) {
                        ActivityVis.stories = false;
                        ActivityVis.discussions = false;
                        ActivityVis.discussion_edit = true;
                    }
                })
            },
            btnAction = function(btntarget) {
                switch(btntarget) {
                    case 'new_discussion':
                        newDiscussion();
                        break;
                }
            };
            elm.on('click', function() {
                btnAction(scope.btntarget);
            });
        }
    }
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
}])