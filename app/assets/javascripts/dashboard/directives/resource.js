/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
/* global Dropzone */
'use strict';

angular.module('sphericalApp.ResourceDirectives', [])
.directive('resourceform', ['SPHR_HST', function(SPHR_HST) {
  return {
    restrict: 'A',
    controller: "ActivityCtrl",
    templateUrl: SPHR_HST + "tpls/resource_form.html"
  };
}])
.directive('resourceCloseBox', ['ActivityVis', function(ActivityVis) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        scope.$apply(function() {
          jQuery('.swiper-entity', '.topic-swiper').removeClass('unhighlight');
          ActivityVis.overlay = null;
        });
      });
    }
  };
}])
.directive('anotherUrl', ['$compile', function($compile) {
  return {
    restrict: 'A',
    controller: function($scope) {
      $scope.urlinc = 1;
    },
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        scope.urlinc = scope.urlinc + 1;
        var container = elm.parent(),
        tpl = angular.element('<p class="url_input"><span class="anotherurl" another-url>&nbsp;</span>\n<input type="text" placeholder="URL" name="url_' + scope.urlinc + '" ng-model="url_' + scope.urlinc + '" is-focussed /></p>');
        $compile(tpl)(scope);
        container.after(tpl);
        jQuery('.anotherurl').css({opacity: 0});
        jQuery('.anotherurl').last().css({opacity: 1});
      });
    }
  };
}])
.directive('resourceDzone', [function() {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      scope.resourceDropzone = new Dropzone(elm[0],
        {
          url: "/dashboard/upload_resource",
          paramName: 'resrc',
          clickable: true,
          autoProcessQueue: false,
          uploadMultiple: false,
          maxFilesize: 2,
          dictFileTooBig: "File cannot be larger than 2 MB."
        }
      )
      .on("drop", function() {
        jQuery('.dz-preview').remove();
      })
      .on("addedfile", function(file) {
        scope.$apply(function() {
          scope.resource_present = true;
        });
      })
      .on("complete", function(file) {
        window.setTimeout(function() {
          scope.update_resources();
        }, 2000);
      })
      .on("error", function(file, err, xhr) {
        scope.$apply(function() {
          scope.resource_error = true;
        });
        if ((typeof xhr !== 'undefined') && (xhr.status !== 200)) {
          jQuery("span[data-dz-errormessage]")
          .html('Sorry, there was a server error: ' + xhr.statusText + '<br />Please cancel and try again.');
        } else {
          jQuery("span[data-dz-errormessage]")
          .html('Sorry, there was an error: ' + err + '<br />Please cancel and try again.');
        }
      });
    }
  };
}]);
