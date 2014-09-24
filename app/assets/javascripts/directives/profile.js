/*jshint jquery: true, browser: true, devel: true, globalstrict: true, sub: true */
/* global angular */
/* global Dropzone */
'use strict';

angular.module('sphericalIoApp.ProfileDirectives', [])
.directive('dzone', [function() {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      scope.profilePicDropzone = new Dropzone(elm[0],
        {
            url: "/personal_settings/upload_profile_pic",
            paramName: 'ppic',
            clickable: true,
            autoProcessQueue: false,
            uploadMultiple: false,
            maxFilesize: 2,
            dictFileTooBig: "File cannot be larger than 2 MB.",
            dictInvalidFileType: "File must be of type jpg, gif or png.",
            acceptedFiles: ".jpg, .jpeg, .gif, .png"
        }
      )
      .on("drop", function() {
          $('.dz-preview').remove();
      })
      .on("addedfile", function(file) {
        scope.$apply(function() {
          scope.picture_present = true;
        });
      })
      .on("complete", function(file) {
        window.setTimeout(function() {
          scope.update_user();
        }, 2000);
      })
      .on("error", function(file, err, xhr) {
          scope.$apply(function() {
            scope.picture_error = true;
          });
          if ((typeof xhr !== 'undefined') && (xhr.status !== 200)) {
              $("span[data-dz-errormessage]")
              .html('Sorry, there was a server error: ' + xhr.statusText + '<br />Please cancel and try again.');
          } else {
              $("span[data-dz-errormessage]")
              .html('Sorry, there was an error: ' + err + '<br />Please cancel and try again.');
          }
      });
    }
  };
}])
.directive('savePic', [function() {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        if (scope.picture_present && !scope.picture_error) {
          scope.profilePicDropzone.processQueue();
          scope.$apply(function() {
            scope.update_user();
            scope.picture_present = false;
          });
        }
      });
    }
  };
}])
.directive('cancelPic', ['$compile', function($compile) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.on('click', function() {
        if (scope.picture_present) {
          scope.profilePicDropzone.removeAllFiles(true);
          scope.$apply(function() {
            scope.picture_present = false;
            scope.picture_error = false;
          });
        }
      });
    }
  };
}])
.directive('pwdMatch', [function() {
  // expects fields named "password" and "pwd_confirm"
  // with this directive on pwd_confirm
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      var myform = elm.closest('form').attr('name');
      elm.on('blur', function() {
        if (scope[myform].password.$valid && (scope[myform].password.$modelValue == scope[myform].pwd_confirm.$modelValue)) {
          scope.$apply(function() {
            scope[myform].pwd_confirm.$setValidity('match', true);
          });
        } else if (scope[myform].password.$valid && (scope[myform].password.$modelValue != scope[myform].pwd_confirm.$modelValue)) {
          scope.$apply(function() {
            scope[myform].pwd_confirm.$setValidity('match', false);
          });
        }
      });
    }
  };
}])
.directive('uniqueEmail', ['$http', function($http) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      var formname = elm.closest('form').attr('name'),
      fldname = elm.attr('name');
      elm.on('blur', function() {
        if (scope[formname][fldname].$pristine) {
          return;
        }
        if (scope[formname][fldname].$modelValue === '') {
          scope[formname][fldname].$setValidity('required', false);
          return;
        } else {
          scope[formname][fldname].$setValidity('required', true);
        }
        if (!/^[a-z0-9\.\_\%\+\-]+@[a-z0-9\.\-]+\.[a-z]{2,4}$/.test(scope[formname][fldname].$modelValue)) {
          scope[formname][fldname].$setValidity('invalid', false);
          return;
        } else {
          scope[formname][fldname].$setValidity('invalid', true);
        }
        scope.checking_email = true;
        var email_to_check = scope[formname][fldname].$modelValue;
        $http.get('/personal_settings/unique_email_check', {params: {email: email_to_check}})
        .success(function(result) {
          scope[formname][fldname].$setValidity('unique_email', result.email_unique);
          scope.checking_email = false;
        });
      });
    }
  };
}])
.directive('uniqueScreenname', ['$http', function($http) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      var formname = elm.closest('form').attr('name'),
      fldname = elm.attr('name');
      elm.on('blur', function() {
        if (scope[formname][fldname].$pristine) {
          return;
        }
        if (scope[formname][fldname].$modelValue === '') {
          scope[formname][fldname].$setPristine();
          return;
        }
        scope.checking_screenname = true;
        var screenname_to_check = scope[formname][fldname].$modelValue;
        $http.get('/personal_settings/unique_screenname_check', {params: {screenname: screenname_to_check}})
        .success(function(result) {
          scope[formname][fldname].$setValidity('unique_screenname', result.screenname_unique);
          scope.checking_screenname = false;
        });
      });
    }
  };
}]);
