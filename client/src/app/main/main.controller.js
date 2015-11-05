(function() {
  'use strict';

  angular
    .module('sphericalFrontEnd')
    .controller('MainController', MainController)
    .directive('orientable', function () {       
        return {
            link: function(scope, element, attrs) {   

                element.bind("load" , function(e){ 

                    var heightDiff = parseInt(this.naturalHeight) - parseInt($(".storyBlock").height());                        
                    var widthDiff =  parseInt(this.naturalWidth) - parseInt($(".storyBlock").width());
                    if( heightDiff > 0 && widthDiff > 0 ){
                        if(heightDiff > widthDiff){
                            this.className = "tallNarrowImage";
                        } else {
                            this.className = "longWideImage";
                        }
                    } else if (heightDiff > 0) {
                        this.className = "tallNarrowImage";
                    } else {
                        this.className = "longWideImage";
                    }
                });
            }
        }
    });


  /** @ngInject */
  function MainController($scope, $http, $timeout, webDevTec, toastr) {
    var preLoadedSpheres = 
    [
        {
            "src":"/assets/images/cryo_sphere1.png",
            "sphereName": "Cryosphere"
        } ,
        {
            "src":"/assets/images/atmosphere.png",
            "sphereName": "Atmosphere"
        } ,
        {
            "src":"/assets/images/forest-picture-circle.png",
            "sphereName": "Forest"
        } , 
        {
            "src":"/assets/images/volcano-circle.png",
            "sphereName": "Volcano"
        } ,
        {
            "src":"/assets/images/swamp-circle.png",
            "sphereName": "Swamp"
        } , 
        {
            "src":"/assets/images/coral-circle.png",
            "sphereName": "Coral"
        } , 
        {
            "src":"/assets/images/andromeda-circle.png",
            "sphereName": "Space"
        } , 
        {
            "src":"/assets/images/forest-circle.png",
            "sphereName": "Trees"
        } , 
        {
            "src":"/assets/images/round-mtn-picture.png",
            "sphereName": "Rocky Mountains"
        } 

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

    var currentSphereIndex = 1;
    var nextSphereUp = 2;
    var nextSphereDown; // = preLoadedSpheres[preLoadedSpheres.length - 1];


    //This is jQuery, try not to mix angular and jquery when possible, because
    // they both do DOM manipulation.
    $(".sphere-top-img-static").attr("src", preLoadedSpheres[currentSphereIndex + 1].src);
    $(".sphere-middle-img-static").attr("src", preLoadedSpheres[currentSphereIndex].src);
    $(".sphere-bottom-img-static").attr("src", preLoadedSpheres[currentSphereIndex - 1].src);
    //$(".sphere-bottom-img-static").attr("src", preLoadedSpheres[preLoadedSpheres.length - 1].src);

    $scope.optionsNowVisible = false;

    //Couldn't get Angular to update the dom when switching spheres.  So frustrating.
    //$scope.breadcrumbSphere = preLoadedSpheres[currentSphereIndex].sphereName;
    $("#breadcrumpSphereName").text(preLoadedSpheres[currentSphereIndex].sphereName);

    $scope.backgroundcolor = 'white';
    $scope.backgroundimage= 'full';
    $scope.visibleStory = "";
    $scope.mySavedStories = [];
    $scope.numberOfRows = 1;
    $scope.initialR88rResponse = [
        {
        headline:
            "Fab Lab",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.fablab",
        img:{src:
            "/assets/images/humanLathe_3.jpg"}
        },
        {
        headline:
            "Electric Vehicles",
        url:
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.electricvehicles',
        img:{src:
            "/assets/images/electricvehicle.jpg"}
        },
        {
        headline:
            "Education Policy",
        url:
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.educationpolicy',
        img:{src:
            "/assets/images/ed-policy.jpg"}
        },
        {
        headline:
            "Data Viz",
        url:
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.dataviz',
        img:{src:
            "/assets/images/data-viz.jpg"}
        },
        {
        headline:
            "Geology",
        url:
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.geology',
        img:{src:
            "/assets/images/geology.jpeg"}
        },
        {
        headline:
            "Cloud Computing",
        url:
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.cloudcomputing',
        img:{src:
            "/assets/images/cloud-compute.jpg"}
        },
        {
        headline:
            "CG3D",    
        url:
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.cg3d',
        img:{src:
            "/assets/images/protractor.png"}
        },
        {
        headline:
            "Health Tech",
        url:
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.healthtech',
        img:{src:
            "/assets/images/health-tec.png"}
        },
        {
        headline:
            "IIW",
        url:
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.iiw',
        img:{src:
            "/assets/images/iiw.jpeg"}
        },
        {
        headline:
            "GIS",
        url:
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.gis',
        img:{src:
            "/assets/images/GIS.jpg"}
        },
        {
        headline:
            "Local Food",
        url:
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.localfood',
        img:{src:
            "/assets/images/local-food.jpg"}
        },
        {
        headline:
            "MOOC",
        url:
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.mooc',
        img:{src:
            "/assets/images/mooc.jpg"}
        },
        {
        headline:
            "Next Edge",
        url:
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.nextedgeplus',
        img:{src:
            "/assets/images/nextedge.jpg"}
        },
        {
        headline:
            "Particle Physics",
        url:
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.particlephysics',
        img:{src:
            "/assets/images/particlephysics.jpg"}
        },
        {
        headline:
            "SAP",
        url:
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.sap',
        img:{src:
            "/assets/images/sap.jpg"}
        },
        {
        headline:
            "Ted Plus",
        url:
            'http://v3.api.r88r.net/v3/headlines?cname=V3A.tedplus',
        img:{src:
            "/assets/images/tedplus.jpg"}
        }

    ]

    $scope.getSphereFeeds = function(sphere){
        switch(sphere){
            case "Cryosphere":
            case "Forest":
            case "Coral":
            case "Rocky Mountains":
                $scope.r88rResponse =  [$scope.initialR88rResponse[0],
                        $scope.initialR88rResponse[2],
                        $scope.initialR88rResponse[4],
                        $scope.initialR88rResponse[6],
                        $scope.initialR88rResponse[8],
                        $scope.initialR88rResponse[10],
                        $scope.initialR88rResponse[14],
                        $scope.initialR88rResponse[12]];
                break;
            case "Atmosphere":
            case "Swamp":
            case "Space":
                $scope.r88rResponse =  [$scope.initialR88rResponse[1],
                        $scope.initialR88rResponse[3],
                        $scope.initialR88rResponse[5],
                        $scope.initialR88rResponse[7],
                        $scope.initialR88rResponse[9],
                        $scope.initialR88rResponse[11],
                        $scope.initialR88rResponse[13],
                        $scope.initialR88rResponse[15]];
                break;
            case "Trees":
            case "Volcano":
                $scope.r88rResponse =  [$scope.initialR88rResponse[14],
                        $scope.initialR88rResponse[12],
                        $scope.initialR88rResponse[4],
                        $scope.initialR88rResponse[7],
                        $scope.initialR88rResponse[9],
                        $scope.initialR88rResponse[10],
                        $scope.initialR88rResponse[11],
                        $scope.initialR88rResponse[2]];
                break;

            case "My Sphere":
                $scope.r88rResponse = $scope.mySavedStories;
                break;
        }
    }

    $scope.getSphereFeeds("Atmosphere");

    $scope.clickStory = function(story) {

        //Determine if the story clicked should load a feed or if it's a specific story
        if(story.url && story.url.indexOf("api.r88r.net") > -1){

            $scope.breadcrumbFeed = story.headline;

            $http.get(story.url).
            success(function(data, status, headers, config) {
                $scope.r88rResponse = data.data.headlines;
                $scope.r88rResponse = $scope.deleteNoThumbnails($scope.r88rResponse);
                //$scope.numberOfRows = 2;

            }).
            error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            });


            //$("#row-toggle-button").show();
            //$("#row-toggle-button").css("display","block");
        }

        else if (story.short){
            $scope.visibleStory = {
                headline : story.headline,
                img : {src: story.img.src},
                short : story.short,
                abstract : story.abstract
            };

        }

    }

    $scope.closeStoryView = function() {
        $scope.visibleStory = false;
    }


    $scope.openMySphere = function(){
        $(".text-center").css("background-color","rgba(51, 102, 204, 0.8)");
        $scope.breadcrumbFeed = undefined;
        $scope.r88rResponse = $scope.mySavedStories;
        $(".sphere-top-img-static, .sphere-middle-img-static, .sphere-bottom-img-static").fadeOut();
        $(".my-sphere-background").fadeIn();
        $("#breadcrumpSphereName").text("Back to Other Spheres");
    }

    $scope.saveStoryView = function(visibleStoryArgument) {
        $scope.mySavedStories.push(visibleStoryArgument);
        $(".plus-one").fadeIn().delay(2000).fadeOut();
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
          "-webkit-transform":"translateZ(0)",
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
          "-webkit-transform":"translateZ(0)",
          "margin-top":"-250px",
          "margin-left":"-250px",
          "z-index":"4"
        });


        $(".sphere-bottom-img").attr("src", $scope.bottomSphereUrl);
        $(".sphere-bottom-img").css({
          "height":"400px",  
          "width":"400px",
          "position":"absolute",
          "top":"90%",
          "left":"50%",
          "-webkit-transform":"translateZ(0)",
          "margin-left":"-200px",
          "z-index":"3"
        });

        $(".sphere-top-img").fadeIn(400);
        $(".sphere-middle-img").fadeIn(400);
        $(".sphere-bottom-img").fadeIn(400);


    };

    $scope.getImageClass = function(story) {
        var stop;
    }

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
        if($(".sphere-middle-img-static").is(":visible")){
            if($scope.breadcrumbFeed){ 
                $scope.breadcrumbFeed = undefined;
            }
            $scope.closeStoryView();
            $(".scrollBarWrapper").hide();
            $scope.r88rResponse = $scope.initialR88rResponse;
            if(!$scope.scrollEventTriggered){
                $(".scrollBarWrapper").fadeIn("slow");
            }
            $scope.numberOfRows = 1;
            $("#row-toggle-button").hide();
            return $scope.r88rResponse;
        } else {
            $(".my-sphere-background").fadeOut();
            $(".sphere-top-img-static, .sphere-middle-img-static, .sphere-bottom-img-static").fadeIn();
            $("#breadcrumpSphereName").text(preLoadedSpheres[currentSphereIndex].sphereName);
            $scope.getSphereFeeds(preLoadedSpheres[currentSphereIndex].sphereName);
            $(".text-center").css("background-color","white");
    }

    }

    $scope.getfakeR88rResponse = function(){
        if($scope.breadcrumbFeed){ 
            $scope.breadcrumbFeed = undefined;
        }
        $scope.closeStoryView();
        $scope.getSphereFeeds($("#breadcrumpSphereName").text());
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

                var numSpheres = preLoadedSpheres.length;
                currentSphereIndex = (((currentSphereIndex + 1) % numSpheres) + numSpheres) % numSpheres;
                nextSphereUp = (((currentSphereIndex + 1) % numSpheres) + numSpheres) % numSpheres;
                $("#breadcrumpSphereName").text(preLoadedSpheres[currentSphereIndex].sphereName);
                $("#fakeButton").click();

                $scope.newMiddleSphere = $(".sphere-top-img").attr("src");
                $scope.newBottomSphere = $(".sphere-middle-img").attr("src");
                $(".sphere-middle-img-static").attr("src", $scope.newMiddleSphere);
                $(".sphere-bottom-img-static").attr("src", $scope.newBottomSphere);
                $(".sphere-top-img-static").attr("src", preLoadedSpheres[nextSphereUp].src);
                
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

                var numSpheres = preLoadedSpheres.length;
                currentSphereIndex = (((currentSphereIndex - 1) % numSpheres) + numSpheres) % numSpheres;
                nextSphereDown = (((currentSphereIndex - 1) % numSpheres) + numSpheres) % numSpheres;
                $("#breadcrumpSphereName").text(preLoadedSpheres[currentSphereIndex].sphereName);
                $("#fakeButton").click();

                $scope.newMiddleSphere = $(".sphere-bottom-img").attr("src");
                $scope.newTopSphere = $(".sphere-middle-img").attr("src");
                $(".sphere-middle-img-static").attr("src", $scope.newMiddleSphere);
                $(".sphere-bottom-img-static").attr("src", preLoadedSpheres[nextSphereDown].src);
                $(".sphere-top-img-static").attr("src", $scope.newTopSphere);

                $scope.staticSpheresReappear();

        });

        
        $(".sphere-bottom-img").animate({
            top: '25%'
        }, 1000);
    };


    document.addEventListener('wheel', function(e){
        if($(".sphere-middle-img-static").is(":visible")){

            if(e.wheelDeltaY < -75 && !$scope.scrollEventTriggered)
            {
                $scope.scrollUpSphere();
                $scope.scrollEventTriggered = true;

            } else if (e.wheelDeltaY > 75 && !$scope.scrollEventTriggered)
            {
                $scope.scrollDownSphere();
                $scope.scrollEventTriggered = true;
            }
        }

    });

    $scope.toggleOptions = function() {
        if($scope.optionsNowVisible){
            $scope.optionsNowVisible = false;
        } else {
            $scope.optionsNowVisible = true;
        }
    };




    //touch event handlers for ipad

    var start = {x:0,y:0};

    document.addEventListener('touchstart', function(event) {
            start.x = event.touches[0].pageX;
            start.y = event.touches[0].pageY;
    }, false);

    document.addEventListener("touchmove", function(event) {

    var offset = {};

    offset.x = start.x - event.touches[0].pageX;
    offset.y = start.y - event.touches[0].pageY;
        if(offset.y < -75 && !$scope.scrollEventTriggered && $(".sphere-middle-img-static").is(":visible"))
            {
                $scope.scrollUpSphere();
                $scope.scrollEventTriggered = true;


            } else if (offset.y > 75 && !$scope.scrollEventTriggered)
            {
                $scope.scrollDownSphere();
                $scope.scrollEventTriggered = true;

            }

            console.log("x is" + offset.x);
            console.log("y is" + offset.y);
    return offset;

    }, false);




  } //This is the end of the big thing


})();
