(function() {
  'use strict';

  angular
    .module('sphericalFrontEnd')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController($scope, $http, $timeout, webDevTec, toastr) {
    var vm = this;
        $(".sphere-top-img-static").attr("src", "/assets/images/forest-picture-circle.png");
        $(".sphere-top-img-static").css("height","400px");
        $(".sphere-top-img-static").css("width","400px");
        $(".sphere-top-img-static").css("position","absolute");
        $(".sphere-top-img-static").css("top", "-250px");
        $(".sphere-top-img-static").css("left","35%");
        $(".sphere-top-img-static").css("z-index","1");
        $(".sphere-top-img-static").css("opacity",".5");

        $(".sphere-middle-img-static").attr("src", "/assets/images/cryo_sphere1.png");
        $(".sphere-middle-img-static").css("height","500px");
        $(".sphere-middle-img-static").css("width","500px");
        $(".sphere-middle-img-static").css("position","absolute");
        $(".sphere-middle-img-static").css("top", "20%");
        $(".sphere-middle-img-static").css("left","31%");        
        $(".sphere-middle-img-static").css("z-index","1");

        $(".sphere-bottom-img-static").attr("src", "/assets/images/forest-picture-circle.png");
        $(".sphere-bottom-img-static").css("height","400px");
        $(".sphere-bottom-img-static").css("width","400px");
        $(".sphere-bottom-img-static").css("position","absolute");
        $(".sphere-bottom-img-static").css("top", "85%");
        $(".sphere-bottom-img-static").css("left","35%");        
        $(".sphere-bottom-img-static").css("z-index","1");
        $(".sphere-bottom-img-static").css("opacity",".5");

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
                $(".sphere-middle-img-static").css("opacity","1");
                $scope.backgroundimage = 'full';
                break;
            case 'full':
                $(".sphere-middle-img-static").css("opacity",".5");;
                $scope.backgroundimage = 'half';
                break;
            case 'half':
                $(".sphere-middle-img-static").css("opacity","0");
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

    $scope.scrollUpSphere = function() {
        $(".scrollBarWrapper").fadeOut(400);
        $(".sphere-top-img-static").fadeOut(400);
        $(".sphere-middle-img-static").fadeOut(400);
        $(".sphere-bottom-img-static").fadeOut(400);

        $scope.topSphereUrl = $(".sphere-top-img-static").attr("src");
        $scope.middleSphereUrl = $(".sphere-middle-img-static").attr("src");
        $scope.bottomSphereUrl = $(".sphere-bottom-img-static").attr("src");

        $(".sphere-top-img").attr("src", $scope.topSphereUrl);
        $(".sphere-top-img").css("height","400px");
        $(".sphere-top-img").css("width","400px");
        $(".sphere-top-img").css("position","absolute");
        $(".sphere-top-img").css("top", "-250px");
        $(".sphere-top-img").css("left","35%");
        $(".sphere-top-img").css("z-index","3");

        $(".sphere-middle-img").attr("src", $scope.middleSphereUrl);
        $(".sphere-middle-img").css("height","500px");
        $(".sphere-middle-img").css("width","500px");
        $(".sphere-middle-img").css("position","absolute");
        $(".sphere-middle-img").css("top", "20%");
        $(".sphere-middle-img").css("left","31%");        
        $(".sphere-middle-img").css("z-index","3");

        $(".sphere-bottom-img").attr("src", $scope.topSphereUrl);
        $(".sphere-bottom-img").css("height","400px");
        $(".sphere-bottom-img").css("width","400px");
        $(".sphere-bottom-img").css("position","absolute");
        $(".sphere-bottom-img").css("top", "85%");
        $(".sphere-bottom-img").css("left","35%");        
        $(".sphere-bottom-img").css("z-index","3");

        $(".sphere-top-img").fadeIn(400);
        $(".sphere-middle-img").fadeIn(400);
        $(".sphere-bottom-img").fadeIn(400);


        $(".sphere-top-img").animate({
                top: '20%'
            }, 1000, function(){
                //$(".sphere-top").toggle();
        });
       
        $(".sphere-middle-img").animate({
            top: '85%',
        }, 1000, function(){

                $scope.newMiddleSphere = $(".sphere-top-img").attr("src");
                $scope.newBottomSphere = $(".sphere-middle-img").attr("src");
                $(".sphere-middle-img-static").attr("src", $scope.newMiddleSphere);
                $(".sphere-bottom-img-static").attr("src", $scope.newBottomSphere);
                $(".sphere-top-img-static").attr("src", $scope.newBottomSphere);

                $(".sphere-top-img").fadeOut(400);
                $(".sphere-middle-img").fadeOut(400);
                $(".sphere-bottom-img").fadeOut(400);

                $(".scrollBarWrapper").fadeIn(400);
                $(".sphere-top-img-static").fadeIn(400);
                $(".sphere-middle-img-static").fadeIn(400);
                $(".sphere-bottom-img-static").fadeIn(400);


        });

        $(".sphere-bottom-img").animate({
            top: '150%'
        }, 1000);
    };


$(window).bind('mousewheel', function(e){
    if(e.originalEvent.wheelDelta > 200 && !$scope.scrollEventTriggered)
    {
        $scope.scrollUpSphere();
        $scope.scrollEventTriggered = true;
    } 
    else if (e.originalEvent.wheelDelta < 200 && $scope.scrollEventTriggered)
    {
        
        $scope.scrollEventTriggered = false;
    }

});











  }
})();
