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

    var feeds = 
    [
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.fablab",
        'http://v3.api.r88r.net/v3/headlines?cname=V3A.electricvehicles',
        'http://v3.api.r88r.net/v3/headlines?cname=V3A.educationpolicy',
        'http://v3.api.r88r.net/v3/headlines?cname=V3A.dataviz',
        'http://v3.api.r88r.net/v3/headlines?cname=V3A.geology',
        'http://v3.api.r88r.net/v3/headlines?cname=V3A.cloudcomputing',
        'http://v3.api.r88r.net/v3/headlines?cname=V3A.cg3d',
        'http://v3.api.r88r.net/v3/headlines?cname=V3A.healthtech',
        'http://v3.api.r88r.net/v3/headlines?cname=V3A.iiw',
        'http://v3.api.r88r.net/v3/headlines?cname=V3A.gis',
        'http://v3.api.r88r.net/v3/headlines?cname=V3A.localfood',
        'http://v3.api.r88r.net/v3/headlines?cname=V3A.mooc',
        'http://v3.api.r88r.net/v3/headlines?cname=V3A.nextedgeplus',
        'http://v3.api.r88r.net/v3/headlines?cname=V3A.particlephysics',
        'http://v3.api.r88r.net/v3/headlines?cname=V3A.sap',
        'http://v3.api.r88r.net/v3/headlines?cname=V3A.tedplus'
    ]

    var currentSphereIndex = 0;

    $(".sphere-top-img-static").attr("src", preLoadedSpheres[currentSphereIndex + 1]);
    $(".sphere-middle-img-static").attr("src", preLoadedSpheres[currentSphereIndex]);
    $(".sphere-bottom-img-static").attr("src", preLoadedSpheres[preLoadedSpheres.length - 1]);

    $scope.optionsNowVisible = false;

    $scope.backgroundcolor = 'white';
    $scope.backgroundimage= 'full';
    $scope.visibleStory = "";
    $scope.numberOfRows = 1;
    $scope.initialR88rResponse = [
        {
        "title":
            "Fab Lab",
        "url":
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.fablab",
        thumbnail:
            "/assets/images/humanLathe_3.jpg"
        },
        {
        "title":
            "Electric Vehicles",
        "url":
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.electricvehicles',
        thumbnail:
            "/assets/images/electricvehicle.jpg"
        },
        {
        "title":
            "Education Policy",
        "url":
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.educationpolicy',
        thumbnail:
            "/assets/images/ed-policy.jpg"
        },
        {
        "title":
            "Data Viz",
        "url":
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.dataviz',
        thumbnail:
            "/assets/images/data-viz.jpg"
        },
        {
        "title":
            "Geology",
        "url":
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.geology',
        thumbnail:
            "/assets/images/geology.jpeg"
        },
        {
        "title":
            "Cloud Computing",
        "url":
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.cloudcomputing',
        thumbnail:
            "/assets/images/cloud-compute.jpg"
        },
        {
        "title":
            "CG3D",    
        "url":
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.cg3d',
        thumbnail:
            "/assets/images/protractor.png"
        },
        {
        "title":
            "Health Tech",
        "url":
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.healthtech',
        thumbnail:
            "/assets/images/health-tec.png"
        },
        {
        "title":
            "IIW",
        "url":
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.iiw',
        thumbnail:
            "/assets/images/iiw.jpeg"   
        },
        {
        "title":
            "GIS",
        "url":
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.gis',
        thumbnail:
            "/assets/images/GIS.jpg"
        },
        {
        "title":
            "Local Food",
        "url":
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.localfood',
        thumbnail:
            "/assets/images/local-food.jpg"
        },
        {
        "title":
            "MOOC",
        "url":
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.mooc',
        thumbnail:
            "/assets/images/mooc.jpg"
        },
        {
        "title":
            "Next Edge",
        "url":
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.nextedgeplus',
        thumbnail:
            "/assets/images/nextedge.jpg"
        },
        {
        "title":
            "Particle Physics",
        "url":
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.particlephysics',
        thumbnail:
            "/assets/images/particlephysics.jpg"
        },
        {
        "title":
            "SAP",
        "url":
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.sap',
        thumbnail:
            "/assets/images/sap.jpg"
        },
        {
        "title":
            "Ted Plus",
        "url":
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.tedplus',
        thumbnail:
            "/assets/images/tedplus.jpg"
        }

    ]

    $scope.r88rResponse = $scope.initialR88rResponse;

    $scope.clickStory = function(story) {

        //Determine if the story clicked should load a feed or if it's a specific story
        if(story.url && story.url.indexOf("api.r88r.net") > -1){

            $http.get(story.url).
            success(function(data, status, headers, config) {
                $scope.r88rResponse = data.data.headlines;
                $scope.r88rResponse = $scope.deleteNoThumbnails($scope.r88rResponse);
                $scope.numberOfRows = 2;

            }).
            error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            });


            $("#row-toggle-button").show();
            $("#row-toggle-button").css("display","block");
        }

        else if (story.short){
            $scope.visibleStory = {
                headline : story.headline,
                short : story.short,
                abstract : story.abstract
            };

        }

    }

    $scope.closeStoryView = function() {
        $scope.visibleStory = false;
    }

    $scope.isStoryVisible = function() {
            if($scope.visibleStory) {
                return true;
            } else {
                return false;
            }

    }

    $scope.deleteNoThumbnails = function(array) {
        var result = [],
        i;
        for (i = 0; i<array.length; i++){
            if(array[i].thumbnail){
                result.push(array[i]);
            }
        }
        return result;
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

    $scope.newColumn = function(index, str) {
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
        $(".scrollBarWrapper").fadeOut(400, function(){
            //These lines will not trigger the update of row of entries, but 
            //clicking an invisible button that then calls getR88rResponse
            //does somehow trigger the interface refresh...
            //$scope.getR88rResponse();
            //$scope.$apply();
            $("#row-toggle-button").click();
        });
        $(".sphere-top-img-static").fadeOut(400);
        $(".sphere-middle-img-static").fadeOut(400);
        $(".sphere-bottom-img-static").fadeOut(400);

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

    $scope.staticSpheresReappear = function(){
                $(".sphere-top-img").fadeOut(400);
                $(".sphere-middle-img").fadeOut(400);
                $(".sphere-bottom-img").fadeOut(400);

                $(".scrollBarWrapper").fadeIn(400);
                $(".sphere-top-img-static").fadeIn(400);
                $(".sphere-middle-img-static").fadeIn(400);
                $(".sphere-bottom-img-static").fadeIn(400, function(){
                    $scope.scrollEventTriggered = false;
                });

    }

    $scope.getR88rResponse = function(){
        $(".scrollBarWrapper").hide();
        $scope.r88rResponse = $scope.initialR88rResponse;
        if(!$scope.scrollEventTriggered){
            $(".scrollBarWrapper").fadeIn("slow");
        }
        $scope.numberOfRows = 1;
        $("#row-toggle-button").hide();
        return $scope.r88rResponse;
    }

    $scope.scrollUpSphere = function() {

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
                
                $scope.staticSpheresReappear();
        });

        $(".sphere-bottom-img").animate({
            top: '250%'
        }, 1000);
    };
    $scope.scrollDownSphere = function() {

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

                $scope.staticSpheresReappear();
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

    $scope.toggleOptions = function() {
        if($scope.optionsNowVisible){
            $scope.optionsNowVisible = false;
        } else {
            $scope.optionsNowVisible = true;
        }
    };


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
    $(window).bind('touchend', function(event) {
        var e = event.originalEvent;
//        $(this).scrollTop(scrollStartPos - e.touches[0].pageY);
//        e.preventDefault();
    });
    $(window).bind('touchstart', function(event) {
        var e = event.originalEvent;
//        $(this).scrollTop(scrollStartPos - e.touches[0].pageY);
//        e.preventDefault();
    });

})();
