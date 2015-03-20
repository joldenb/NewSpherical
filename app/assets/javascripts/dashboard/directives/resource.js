/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
/* global Dropzone */
'use strict';

angular.module('sphericalApp.ResourceDirectives', [])
.directive('resourceDisplay', ['SPHR_HST', function(SPHR_HST) {
  return {
    restrict: 'A',
    templateUrl: SPHR_HST + "tpls/resource_display.html"
  };
}])
.directive('resourceform', ['SPHR_HST', function(SPHR_HST) {
  return {
    restrict: 'A',
    templateUrl: SPHR_HST + "tpls/resource_form.html"
  };
}])
.directive('editResource', ['$compile', 'ActivityVis', function($compile, ActivityVis) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        scope.newresource = {};
        scope.newresource.id = scope.chooser.state.activeResource.id;
        scope.resource_name = scope.chooser.state.activeResource.resource_name;
        scope.resource_description = scope.chooser.state.activeResource.headline;
        var urlcount = 1,
        container = jQuery('.url_input'),
        urls = angular.copy(scope.chooser.state.activeResource.resource_urls);
        if (urls && urls.length > 0) {
          scope.url_1 = urls.shift();
        }
        angular.forEach(urls, function(url) {
          urlcount++;
          var tpl = angular.element('<p class="url_input" id="url_' + urlcount + '"><span class="anotherurl" another-url>&nbsp;</span>\n<input type="text" placeholder="URL" name="url_' + urlcount + '" ng-model="resourceform.url_' + urlcount + '" is-focussed ng-init="resourceform.url_' + urlcount + ' = \'' + url + '\'" /></p>');
          $compile(tpl)(scope);
          container.after(tpl);
          container = tpl;
          scope.urlinc = urlcount;
        });
        jQuery('.anotherurl').css({opacity: 0});
        jQuery('.anotherurl').last().css({opacity: 1});
        scope.resourceform.resource_name.$dirty = true;
        var _rlist = jQuery('.resource_list');
        _rlist.html('');
        angular.forEach(scope.chooser.state.activeResource.resource_files, function(item) {
          _rlist.append('<p><span>&nbsp;</span>' + item.name + '<span class="trshcan"  fileid="' + item.fileid + '" rsrc="' + item.rsrc +'" rfile-delete>&nbsp;</span></p>');
        });
        $compile(_rlist)(scope);
        scope.$apply(function() {
          scope.get_formatted_resource_items(scope.chooser.state.currentTopicId);
          ActivityVis.overlay = 'resource_edit';
          ActivityVis.new_edit_resource = 'Edit';
        });
      });
    }
  };
}])
.directive('resourceCloseBox', ['ActivityVis', function(ActivityVis) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        scope.load_resources();
        scope.$apply(function() {
          scope.newresource = {};
          scope.newresource.id = '';
          scope.resource_name = '';
          scope.resource_description = '';
          scope.urlinc = 1;
          scope.url_1 = '';
          angular.forEach(scope.resourceform, function(v,k) {
            if (/^url_[\d]?$/.test(k) && k != 'url_1') {
              scope.resourceform[k] = '';
              jQuery('#' + k).remove();
            }
          });
          jQuery('.anotherurl').first().css({opacity: 1});
          jQuery('.resource_list').html('');
          scope.resource_fbk = '';
          scope.fbk_error = false;
          ActivityVis.overlay = null;
          scope.resourceform.$setPristine();
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
.directive('deleteResource', ['$http', '$timeout', 'SPHR_HST', 'ActivityVis', function($http, $timeout, SPHR_HST, ActivityVis) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        var resourceid = scope.resourceform.resource_id.$modelValue,
        data = {resourceid: resourceid};
        $http.post(SPHR_HST + 'dashboard/delete_resource', data)
        .success(function(response) {
          if (response.success) {
            scope.newresource = {};
            scope.newresource.id = '';
            scope.resource_name = '';
            scope.resource_description = '';
            scope.urlinc = 1;
            scope.url_1 = '';
            angular.forEach(scope.resourceform, function(v,k) {
              if (/^url_[\d]?$/.test(k) && k != 'url_1') {
                scope.resourceform[k] = '';
                jQuery('#' + k).remove();
              }
            });
            jQuery('.anotherurl').first().css({opacity: 1});
            jQuery('.resource_list').html('');
            scope.resource_fbk = '';
            scope.fbk_error = false;
            scope.resourceform.$setPristine();
            scope.chooser.state.activeResource = null;
            scope.load_resources().then(function(first_resourceid) {
              scope.set_activeresource(0);
              scope.set_carousel_index(first_resourceid);
              scope.visible.overlay = null;
            });
          }
        });
      });
    }
  };
}])
.directive('saveResource', ['$http', '$timeout', '$compile', 'SPHR_HST', 'ActivityVis', function($http, $timeout, $compile, SPHR_HST, ActivityVis) {
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
        data.resource_description = scope.resourceform.resource_description.$modelValue;
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
              scope.newresource.id = '';
              scope.resource_name = '';
              scope.resource_description = '';
              scope.url_1 = '';
              angular.forEach(scope.resourceform, function(v,k) {
                if (/^url_[\d]?$/.test(k) && k != 'url_1') {
                  scope.urlinc = 1;
                  scope.resourceform[k] = '';
                  jQuery('#' + k).remove();
                  jQuery('.anotherurl').first().css({opacity: 1});
                }
              });
              jQuery('.resource_list').html('');
              scope.resource_fbk = '';
              scope.fbk_error = false;
              ActivityVis.overlay = null;
              scope.resourceform.$setPristine();

              var topic = scope.chooser.state.currentTopicId,
              current_resourceid;
              scope.get_formatted_resource_items(topic)
              .then(function() {
                var current_resourceid;
                if (scope.chooser.state.activeResource) {
                  current_resourceid = scope.chooser.state.activeResource.id;
                } else {
                  scope.set_activeresource(0);
                  current_resourceid = scope.chooser.first_item;
                }
                return current_resourceid;
              })
              .then(function(resourceid) {
                scope.chooser.state.activeResource = null;
                scope.load_resources();
                ActivityVis.activity_window = 'resources';
                scope.chooser.state.topicIndicatorVisible = true;
                // $state.go(
                //     'sphere.topic.resource', {topic: scope.chooser.state.currentTopic, resource: resourceid}
                // );
              });
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
          tpl = angular.element('<p class="url_input" id="url_' + incr + '"><span class="anotherurl" another-url>&nbsp;</span>\n<input type="text" placeholder="URL" name="url_' + incr + '" ng-model="resourceform.url_' + incr + '" is-focussed /></p>');
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
// .directive('resourceDzone', ['$window', '$compile', 'SPHR_HST', function($window, $compile, SPHR_HST) {
//   return {
//     restrict: 'A',
//     link: function(scope, elm, attrs) {
//       scope.resourceDropzone = new Dropzone(elm[0],
//         {
//           url: SPHR_HST + "dashboard/upload_resource_file",
//           paramName: 'resrc',
//           clickable: true,
//           autoProcessQueue: true,
//           uploadMultiple: false,
//           maxFilesize: 2,
//           createImageThumbnails: false,
//           dictFileTooBig: "File cannot be larger than 2 MB.",
//           previewsContainer: '.upload-preview'
//         }
//       )
//       .on("sending", function(file, xhr, formData) {
//         if ($window.sessionStorage.spheretoken) {
//           xhr.setRequestHeader('Authorization', 'Bearer token="' + $window.sessionStorage.spheretoken + '"');
//         }
//       })
//       .on("success", function(file, response) {
//         this.removeAllFiles();
//         var _rlist = jQuery('.resource_list');
//         _rlist.html('');
//         angular.forEach(response.resource_list, function(item) {
//           _rlist.append('<p><span>&nbsp;</span>' + item[0] + '<span class="trshcan"  fileid="' + item[1] + '" rsrc="' + item[2] +'" rfile-delete>&nbsp;</span></p>');
//         });
//         $compile(_rlist)(scope);
//         if (response.resource_list.length > 10) {
//           jQuery('.resource_form').perfectScrollbar('update');
//         }
//       })
//       .on("error", function(file, err, xhr) {
//         scope.$apply(function() {
//           scope.resource_error = true;
//         });
//         console.log(err);
//         jQuery("span[data-dz-errormessage]").html('');
//         if (err.msg) {
//           jQuery("span[data-dz-errormessage]:last").html(err.msg);
//         } else {
//           jQuery("span[data-dz-errormessage]:last").html(err);
//         }
//       });
//     }
//   };
// }])
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
