(function() {
  'use strict';

  angular
    .module('sphericalFrontEnd')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController($scope, $http, $timeout, webDevTec, toastr) {
    var preLoadedSpheres = 
    [
        "/assets/images/cryo_sphere1.png",
        "/assets/images/atmosphere.png",
        "/assets/images/forest-picture-circle.png"
    ]

    var currentSphereIndex = 0;

    $(".sphere-top-img-static").attr("src", preLoadedSpheres[currentSphereIndex + 1]);
    $(".sphere-middle-img-static").attr("src", preLoadedSpheres[currentSphereIndex]);
    $(".sphere-bottom-img-static").attr("src", preLoadedSpheres[preLoadedSpheres.length - 1]);

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

    $scope.setAnimationSphereStyles = function(){
        $scope.topSphereUrl = $(".sphere-top-img-static").attr("src");
        $scope.middleSphereUrl = $(".sphere-middle-img-static").attr("src");
        $scope.bottomSphereUrl = $(".sphere-bottom-img-static").attr("src");

        $(".sphere-top-img").attr("src", $scope.topSphereUrl);
        $(".sphere-top-img").css({
          "height":"400px",  
          "width":"400px",
          "position":"absolute",
          "top":"-40%",
          "left":"50%",
          "margin-left":"-200px",
          "z-index":"5"
        });
        
        $(".sphere-middle-img").attr("src", $scope.middleSphereUrl);
        $(".sphere-middle-img").css({
          "height":"500px",  
          "width":"500px",
          "position":"absolute",
          "top":"50%",
          "left":"50%",
          "margin-top":"-250px",
          "margin-left":"-250px",
          "z-index":"4"
        });


        $(".sphere-bottom-img").attr("src", $scope.topSphereUrl);
        $(".sphere-bottom-img").css({
          "height":"400px",  
          "width":"400px",
          "position":"absolute",
          "top":"90%",
          "left":"50%",
          "margin-left":"-200px",
          "z-index":"3"
        });

        $(".sphere-top-img").fadeIn(400);
        $(".sphere-middle-img").fadeIn(400);
        $(".sphere-bottom-img").fadeIn(400);


    };


    $scope.scrollUpSphere = function() {
        $(".scrollBarWrapper").fadeOut(400);
        $(".sphere-top-img-static").fadeOut(400);
        $(".sphere-middle-img-static").fadeOut(400);
        $(".sphere-bottom-img-static").fadeOut(400);

        //This function will get all the animation spheres ready to go to 
        //transition up a sphere.
        $scope.setAnimationSphereStyles();

        $(".sphere-top-img").animate({
                top: '30%'
        }, 1000);
       
        $(".sphere-middle-img").animate({
            top: '100%',
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
                $(".sphere-bottom-img-static").fadeIn(400, function(){
                    $scope.scrollEventTriggered = false;
                });

        });

        $(".sphere-bottom-img").animate({
            top: '250%'
        }, 1000);
    };
    $scope.scrollDownSphere = function() {
        $(".scrollBarWrapper").fadeOut(400);
        $(".sphere-top-img-static").fadeOut(400);
        $(".sphere-middle-img-static").fadeOut(400);
        $(".sphere-bottom-img-static").fadeOut(400);

        //This function will get all the animation spheres ready to go to 
        //transition up a sphere.
        $scope.setAnimationSphereStyles();

        $(".sphere-top-img").animate({
                top: '-250%'
        }, 1000);
       
        $(".sphere-middle-img").animate({
            top: '-10%',
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
                $(".sphere-bottom-img-static").fadeIn(400, function(){
                    $scope.scrollEventTriggered = false;
                });

        });

        $(".sphere-bottom-img").animate({
            top: '25%'
        }, 1000);
    };


    $(window).bind('wheel', function(e){
        if(e.originalEvent.deltaY < -75 && !$scope.scrollEventTriggered)
        {
            $scope.scrollUpSphere();
            $scope.scrollEventTriggered = true;
        } else if (e.originalEvent.deltaY > 75 && !$scope.scrollEventTriggered)
        {
            $scope.scrollDownSphere();
            $scope.scrollEventTriggered = true;
        }

    });

  }

    $(window).bind('onscroll', function(event) {
        // jQuery clones events, but only with a limited number of properties for perf reasons. Need the original event to get 'touches'
        var e = event.originalEvent;
//        scrollStartPos = $(this).scrollTop() + e.touches[0].pageY;
//        e.preventDefault();
    });
    $(window).bind('touchmove', function(event) {
        var e = event.originalEvent;
//        $(this).scrollTop(scrollStartPos - e.touches[0].pageY);
//        e.preventDefault();
    });

})();
