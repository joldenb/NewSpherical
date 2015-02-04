/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
/* global Dropzone */
'use strict';

angular.module('sphericalApp.ResourceDirectives', [])
.directive('resourceDisplay', ['SPHR_HST', function(SPHR_HST) {
  return {
    restrict: 'A',
    templateUrl: SPHR_HST + "tpls/resource_display.html",
    link: function(scope, elm, attrs) {
      jQuery('.resource').perfectScrollbar({suppressScrollX: true});
    }
  };
}])
.directive('resourceform', ['SPHR_HST', function(SPHR_HST) {
  return {
    restrict: 'A',
    controller: "ActivityCtrl",
    templateUrl: SPHR_HST + "tpls/resource_form.html",
    link: function(scope, elm, attrs) {
      jQuery('.resource_form').perfectScrollbar({suppressScrollX: true});
    }
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
.directive('saveNewResource', ['$http', 'SPHR_HST', function($http, SPHR_HST) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('blur', function() {
        scope.resource_fbk = '';
        if (!scope.newresource || !scope.newresource.id) {
          scope.newresource = {};
          scope.newresource.checking = true;
          var data = {};
          data.resource_urls = [];
          data.resource_ctx = scope.resourceform.resource_ctx.$modelValue;
          data.resource_name = scope.resourceform.resource_name.$modelValue;
          data.resource_urls.push(scope.resourceform.url_1.$modelValue);
          angular.forEach(scope.resourceform, function(v,k) {
            if (/^url_[\d]?$/.test(k) && k != 'url_1') {
              data.resource_urls.push(v);
            }
          });
          $http.post(SPHR_HST + 'dashboard/save_new_resource', data)
          .success(function(response) {
            if (response.success) {
              scope.resourceform.resource_name.$setValidity('unique_rname', true);
              scope.newresource.id = response.rsrc_id;
              scope.newresource.checking = false;
            } else if (/resource[\s]*name/i.test(response.msg)) {
              scope.resourceform.resource_name.$setValidity('unique_rname', false);
              scope.newresource.checking = false;
            } else {
              console.log(response.msg);
            }
          })
          .error(function(response, status) {
            console.log(response.msg);
          });
        } else {
          scope.newresource.checking = true;
          var rdata = {};
          rdata.resource_id = scope.newresource.id;
          rdata.resource_ctx = scope.resourceform.resource_ctx.$modelValue;
          rdata.resource_name = scope.resourceform.resource_name.$modelValue;
          $http.post(SPHR_HST + 'dashboard/check_resource_name', rdata)
          .success(function(response) {
            if (response.success) {
              scope.resourceform.resource_name.$setValidity('unique_rname', true);
              scope.newresource.checking = false;
            } else {
              scope.resourceform.resource_name.$setValidity('unique_rname', false);
              scope.newresource.checking = false;
            }
          })
          .error(function(response, status) {
            console.log(response.msg);
          });
        }
      });
    }
  };
}])
.directive('saveResource', ['$http', '$timeout', 'SPHR_HST', 'ActivityVis', function($http, $timeout, SPHR_HST, ActivityVis) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        if (!scope.resourceform.resource_id.$modelValue || !scope.resourceform.resource_name.$modelValue) {
          return;
        }
        var data = {};
        data.resource_urls = [];
        data.resource_id = scope.resourceform.resource_id.$modelValue;
        data.resource_ctx = scope.resourceform.resource_ctx.$modelValue;
        data.resource_name = scope.resourceform.resource_name.$modelValue;
        data.resource_urls.push(scope.resourceform.url_1.$modelValue);
        angular.forEach(scope.resourceform, function(v,k) {
          if (/^url_[\d]?$/.test(k) && k != 'url_1') {
            data.resource_urls.push(v);
          }
        });
        $http.post(SPHR_HST + 'dashboard/save_resource', data)
        .success(function(response) {
          scope.resource_fbk = response.msg;
          if (!response.success) {
            scope.fbk_error = true;
          } else {
            scope.resource_fbk = response.msg;
            $timeout(function () {
              scope.newresource = {};
              scope.resource_fbk = '';
              scope.fbk_error = false;
              ActivityVis.overlay = null;
              scope.activityShow('resources');
            }, 2000);
          }
        })
        .error(function(response, status) {
          scope.resource_fbk = 'Error: ' + status;
          scope.fbk_error = true;
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
        // if (scope.urlinc < 15) {
          var incr = scope.urlinc + 1;
          var container = elm.parent(),
          tpl = angular.element('<p class="url_input"><span class="anotherurl" another-url>&nbsp;</span>\n<input type="text" placeholder="URL" name="url_' + incr + '" ng-model="resourceform.url_' + incr + '" is-focussed /></p>');
          $compile(tpl)(scope);
          scope.urlinc = incr;
          container.after(tpl);
          jQuery('.anotherurl').css({opacity: 0});
          jQuery('.anotherurl').last().css({opacity: 1});
          if (incr > 10) {
            jQuery('.resource_form').perfectScrollbar('update');
          }
        // }
      });
    }
  };
}])
.directive('resourceDzone', ['$window', '$compile', 'SPHR_HST', function($window, $compile, SPHR_HST) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      scope.resourceDropzone = new Dropzone(elm[0],
        {
          url: SPHR_HST + "dashboard/upload_resource_file",
          paramName: 'resrc',
          clickable: true,
          autoProcessQueue: true,
          uploadMultiple: false,
          maxFilesize: 2,
          createImageThumbnails: false,
          dictFileTooBig: "File cannot be larger than 2 MB.",
          previewsContainer: '.upload-preview'
        }
      )
      .on("sending", function(file, xhr, formData) {
        if ($window.sessionStorage.spheretoken) {
          xhr.setRequestHeader('Authorization', 'Bearer token="' + $window.sessionStorage.spheretoken + '"');
        }
      })
      .on("success", function(file, response) {
        this.removeAllFiles();
        var _rlist = jQuery('.resource_list');
        _rlist.html('');
        angular.forEach(response.resource_list, function(item) {
          _rlist.append('<p><span>&nbsp;</span>' + item[0] + '<span class="trshcan"  fileid="' + item[1] + '" rsrc="' + item[2] +'" rfile-delete>&nbsp;</span></p>');
        });
        $compile(_rlist)(scope);
        if (response.resource_list.length > 10) {
          jQuery('.resource_form').perfectScrollbar('update');
        }
      })
      .on("error", function(file, err, xhr) {
        scope.$apply(function() {
          scope.resource_error = true;
        });
        console.log(err);
        jQuery("span[data-dz-errormessage]").html('');
        if (err.msg) {
          jQuery("span[data-dz-errormessage]:last").html(err.msg);
        } else {
          jQuery("span[data-dz-errormessage]:last").html(err);
        }
      });
    }
  };
}])
.directive('rfileDelete', ['$window', '$compile', '$http', 'SPHR_HST', function($window, $compile, $http, SPHR_HST) {
  return {
    restrict: 'A',
    scope: {
      fileid: '@',
      rsrc: '@'
    },
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        var data = {};
        data.rsrc = scope.rsrc;
        data.fileid = scope.fileid;
        $http.post(SPHR_HST + 'dashboard/remove_resource_file', data)
        .success(function(response) {
          var _rlist = jQuery('.resource_list');
          _rlist.html('');
          angular.forEach(response.resource_list, function(item) {
            _rlist.append('<p><span>&nbsp;</span>' + item[0] + '<span class="trshcan"  fileid="' + item[1] + '" rsrc="' + item[2] +'" rfile-delete>&nbsp;</span></p>');
          });
          $compile(_rlist)(scope);
        })
        .error(function(response, status) {
          console.log(response);
        });
      });
    }
  };
}]);
