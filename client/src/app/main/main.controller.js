(function() {
  'use strict';

  angular
    .module('sphericalFrontEnd')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController($scope, $http, $timeout, webDevTec, toastr) {
    var vm = this;
    $scope.backgroundcolor = 'white';
    $scope.backgroundimage= 'full';
    $scope.numberOfRows = 2;

    $http.get('http://v3.api.r88r.net/v3/headlines?cname=V3A.electricvehicles').
    success(function(data, status, headers, config) {
        $scope.r88rResponse = data.data.headlines;
        var stop = "stop";
    }).
    error(function(data, status, headers, config) {
    // called asynchronously if an error occurs
    // or server returns response with an error status.
    });

    vm.awesomeThings = [];
    vm.classAnimation = '';
    vm.creationDate = 1439942576538;
    vm.showToastr = showToastr;

    activate();

    function activate() {
      getWebDevTec();
      $timeout(function() {
        vm.classAnimation = 'rubberBand';
      }, 4000);
    }

    function showToastr() {
      toastr.info('Fork <a href="https://github.com/Swiip/generator-gulp-angular" target="_blank"><b>generator-gulp-angular</b></a>');
      vm.classAnimation = '';
    }

    function getWebDevTec() {
      vm.awesomeThings = webDevTec.getTec();

      angular.forEach(vm.awesomeThings, function(awesomeThing) {
        awesomeThing.rank = Math.random();
      });
    } 

    $scope.toggleBackgroundColor = function() {
        switch($scope.backgroundcolor) {
            case 'white':
                $scope.backgroundcolor = 'gray';
                break;
            case 'gray':
                $scope.backgroundcolor = 'black';
                break;
            case 'black':
                $scope.backgroundcolor = 'white';
                break;
        }
    };//End of the Background Color Toggle

    $scope.toggleBackgroundOpacity = function() {
        switch($scope.backgroundimage) {
            case 'clear':
                $scope.backgroundimage = 'full';
                break;
            case 'full':
                $scope.backgroundimage = 'half';
                break;
            case 'half':
                $scope.backgroundimage = 'clear';
                break;
        }
    };//End of the Background Image Toggle

    $scope.toggleNumberOfRows = function() {
        switch($scope.numberOfRows) {
            case 1:
                $scope.numberOfRows = 2;
                break;
            case 2:
                $scope.numberOfRows = 3;
                break;
            case 3:
                $scope.numberOfRows = 1;
                break;
        }        
    };

    $scope.newColumn = function(index) {
        if ( index % $scope.numberOfRows == 0 ) { 
            return true; 
        } else {
            return false;
        }
    };


    $scope.atLeastTwoRows = function() {
        if ( $scope.numberOfRows == 2 || $scope.numberOfRows == 3 ){
            return true;
        } else {
            return false;
        }
    };

    $scope.atLeastThreeRows = function() {
        if ( $scope.numberOfRows == 3 ){
            return true;
        } else {
            return false;
        }
    };














  }
})();
