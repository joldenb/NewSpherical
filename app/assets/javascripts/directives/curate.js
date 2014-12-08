/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
'use strict';

angular.module('sphericalIoApp.CurateDirectives', [])
.directive('feedPreview', ['$http', function($http) {
  return {
    restrict: 'A',
    controller: function($scope) {
      $scope.feed_preview = {};
      $scope.feed_preview.gathering_data = true;
      $scope.feed_preview.no_image = false;
      $scope.feed_preview.img_select = 0;
    },
    link: function(scope, elm, attrs) {
      var data = {r: encodeURIComponent(attrs.docuri)};
      $http.post('/curate/feeddata', data)
      .success(function(result) {
       scope.feed_preview.page = result.page;
       scope.feed_preview.gathering_data = false;
      })
      .error(function(result, status) {
       console.log(result);
       scope.feed_preview.error = result;
      });
    }
  };
}])
.directive('imgSelect', [function() {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        var thisval = scope.feed_preview.img_select;
        angular.element('.fdimg').removeClass('active');
        angular.element('#fdimg' + thisval).addClass('active');
        scope.$apply(function() {
          scope.feed_preview.no_image = false;
        });
      });
    }
  };
}])
.directive('imgDeselect', [function() {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        if (scope.feed_preview.no_image) {
          angular.element('.fdimg').removeClass('active');
          scope.$apply(function() {
            scope.feed_preview.img_select = null;
          });
        }
      });
    }
  };
}])
.directive('dropFeedSphere', [function() {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      // var formname = elm.closest('form').attr('name'),
      // fldname = elm.attr('name');
      elm.droppable({
        accept: '.psphere',
        tolerance: 'touch',
        hoverClass: 'drop-hover',
        drop: function(event, ui) {
          var fdsphere = ui.draggable.attr('data-sphere');
          scope.$apply(function() {
            scope.feed_preview.feed_sphere = fdsphere;
          });
        }
      });
    }
  };
}]);
