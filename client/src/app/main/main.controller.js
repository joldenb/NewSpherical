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


    var currentSphereIndex = 1;
    var nextSphereUp = 2;
    var nextSphereDown; // = $scope.preLoadedSpheres[$scope.preLoadedSpheres.length - 1];
    $scope.allSpheresVisible = false;
    $scope.optionsNowVisible = false;
    $scope.backgroundcolor = 'white';
    $scope.backgroundimage= 'full';
    $scope.visibleStory = "";
    $scope.mySavedStories = [];
    $scope.numberOfRows = 1;


    $http.get('/app/main/mainData.json').
    then(function(response) {
            $scope.initialR88rResponse = response.data.r88rData;
            var feeds = response.data.feeds;
            $scope.preLoadedSpheres = response.data.preLoadedSpheres;

            //This is jQuery, try not to mix angular and jquery when possible, because
            // they both do DOM manipulation.
            //$(".sphere-bottom-img-static").attr("src", $scope.preLoadedSpheres[$scope.preLoadedSpheres.length - 1].src);
            $(".sphere-top-img-static").attr("src", $scope.preLoadedSpheres[currentSphereIndex + 1].src);
            $(".sphere-middle-img-static").attr("src", $scope.preLoadedSpheres[currentSphereIndex].src);
            $(".sphere-bottom-img-static").attr("src", $scope.preLoadedSpheres[currentSphereIndex - 1].src);
            //Couldn't get Angular to update the dom when switching spheres.  So frustrating.
            //$scope.breadcrumbSphere = $scope.preLoadedSpheres[currentSphereIndex].sphereName;
            $("#breadcrumpSphereName").text($scope.preLoadedSpheres[currentSphereIndex].sphereName);


            $scope.getSphereFeeds("Atmosphere");
        }, function(response) {
            var stop;
    });


    
    $scope.getSphereFeeds = function(sphere){
        switch(sphere){
            case "Cryosphere":
                $scope.r88rResponse =  [$scope.initialR88rResponse[0],
                        $scope.initialR88rResponse[1],
                        $scope.initialR88rResponse[2],
                        $scope.initialR88rResponse[3],
                        $scope.initialR88rResponse[4],
                        $scope.initialR88rResponse[5],
                        $scope.initialR88rResponse[6]];
                break;
            case "Atmosphere":
                $scope.r88rResponse =  [$scope.initialR88rResponse[1],
                        $scope.initialR88rResponse[2],
                        $scope.initialR88rResponse[3],
                        $scope.initialR88rResponse[12],
                        $scope.initialR88rResponse[21],
                        $scope.initialR88rResponse[30],
                        $scope.initialR88rResponse[22]];
                break;
            case "Forest": //not done yet
                $scope.r88rResponse =  [$scope.initialR88rResponse[1],
                        $scope.initialR88rResponse[2],
                        $scope.initialR88rResponse[4],
                        $scope.initialR88rResponse[7],
                        $scope.initialR88rResponse[8],
                        $scope.initialR88rResponse[13],
                        $scope.initialR88rResponse[20],
                        $scope.initialR88rResponse[30]];
                break;
            case "Pollution":
                $scope.r88rResponse =  [$scope.initialR88rResponse[1],
                        $scope.initialR88rResponse[2],
                        $scope.initialR88rResponse[6],
                        $scope.initialR88rResponse[13],
                        $scope.initialR88rResponse[14],
                        $scope.initialR88rResponse[11],
                        $scope.initialR88rResponse[20],
                        $scope.initialR88rResponse[30]];
                break;
            case "Agriculture":
                $scope.r88rResponse =  [$scope.initialR88rResponse[1],
                        $scope.initialR88rResponse[4],
                        $scope.initialR88rResponse[8],
                        $scope.initialR88rResponse[19],
                        $scope.initialR88rResponse[21],
                        $scope.initialR88rResponse[22],
                        $scope.initialR88rResponse[23],
                        $scope.initialR88rResponse[28],
                        $scope.initialR88rResponse[24]];
                break;
            case "Education":
                $scope.r88rResponse =  [$scope.initialR88rResponse[2],
                        $scope.initialR88rResponse[1],
                        $scope.initialR88rResponse[9],
                        $scope.initialR88rResponse[10],
                        $scope.initialR88rResponse[16],
                        $scope.initialR88rResponse[31]];
                break;
            case "Built Environment":
                $scope.r88rResponse =  [$scope.initialR88rResponse[4],
                        $scope.initialR88rResponse[1],
                        $scope.initialR88rResponse[7],
                        $scope.initialR88rResponse[11],
                        $scope.initialR88rResponse[14],
                        $scope.initialR88rResponse[18],
                        $scope.initialR88rResponse[32]];
                break;
            case "Energy":
                $scope.r88rResponse =  [$scope.initialR88rResponse[8],
                        $scope.initialR88rResponse[1],
                        $scope.initialR88rResponse[9],
                        $scope.initialR88rResponse[10],
                        $scope.initialR88rResponse[16],
                        $scope.initialR88rResponse[31],
                        $scope.initialR88rResponse[32],
                        $scope.initialR88rResponse[12]];
                break;
            case "Hydrosphere":
                $scope.r88rResponse =  [$scope.initialR88rResponse[4],
                        $scope.initialR88rResponse[2],
                        $scope.initialR88rResponse[20],
                        $scope.initialR88rResponse[30],
                        $scope.initialR88rResponse[20],
                        $scope.initialR88rResponse[6],
                        $scope.initialR88rResponse[1]];
                break;
            case "My Sphere":
                $scope.r88rResponse = $scope.mySavedStories;
                break;
        }
    }


    $scope.closeSplashScreen = function() {
        $("#splashScreen").fadeOut();
    }

    $scope.clickStory = function(story) {

        //Determine if the story clicked should load a feed or if it's a specific story
        if(story.url && story.url.indexOf("api.r88r.net") > -1){

            $scope.breadcrumbFeed = story.headline;

            $http.get(story.url).
            success(function(data, status, headers, config) {
                $scope.r88rResponse = data.data.headlines;
                $scope.r88rResponse = $scope.deleteNoThumbnails($scope.r88rResponse);

            }).
            error(function(data, status, headers, config) {
            });
        }

        else if (story.short){
            $scope.visibleStory = {
                headline : story.headline,
                img : {src: story.img.src},
                short : story.short,
                abstract : story.abstract,
                link : story.uri
            };
            $(".viewArticleLink").attr("href", story.uri);
        }

    }

    $scope.closeStoryView = function() {
        $scope.visibleStory = false;
    }

    $scope.closeAllSphereView = function(){ 
        $scope.allSpheresVisible = false;
    }

    $scope.openSphere = function(sphere){ 
        $scope.closeAllSphereView();
        if($scope.breadcrumbFeed){ 
            $scope.breadcrumbFeed = undefined;
        }

        for( var i = 0; i < $scope.preLoadedSpheres.length; i++){
            if($scope.preLoadedSpheres[i].sphereName === sphere.sphereName){

                $(".sphere-middle-img-static").fadeOut(400);
                $(".sphere-bottom-img-static").fadeOut(400);
                $(".sphere-top-img-static").fadeOut(400);
                $scope.getSphereFeeds(sphere.sphereName);

                $(".sphere-middle-img-static").attr("src", $scope.preLoadedSpheres[i].src);
                if( i == $scope.preLoadedSpheres.length - 1){
                    $(".sphere-bottom-img-static").attr("src", $scope.preLoadedSpheres[0].src)   
                } else {
                    $(".sphere-bottom-img-static").attr("src", $scope.preLoadedSpheres[i+1].src);
                }
                if( i == 0){
                    $(".sphere-top-img-static").attr("src", $scope.preLoadedSpheres[$scope.preLoadedSpheres.length - 1].src);
                } else {
                    $(".sphere-top-img-static").attr("src", $scope.preLoadedSpheres[i-1].src);
                }

                $(".sphere-middle-img-static").fadeIn(400);
                $(".sphere-bottom-img-static").fadeIn(400);
                $(".sphere-top-img-static").fadeIn(400);
                $(".scrollBarWrapper").fadeIn(400);

                $("#breadcrumpSphereName").text(sphere.sphereName);
                    

            }
        }
    }
    
    $scope.openMySphere = function(){
        $(".text-center").css("background-color","rgba(51, 102, 204, 0.8)");
        $scope.breadcrumbFeed = undefined;
        $scope.r88rResponse = $scope.mySavedStories;
        $(".sphere-top-img-static, .sphere-middle-img-static, .sphere-bottom-img-static").fadeOut();
        $(".my-sphere-background").fadeIn();
        $("#breadcrumpSphereName").text("View All Spheres");
        $("#viewAllSpheres").hide();
    }

    $scope.openAllSphereView = function() {
        $scope.allSpheresVisible = true;
        $scope.closeStoryView();

    }


    $scope.saveStoryView = function(visibleStoryArgument) {
        $scope.mySavedStories.push(visibleStoryArgument);
        $(".plus-one").fadeIn().delay(2000).fadeOut();
    }

    $scope.isAllSpheresVisible = function() {
            if($scope.allSpheresVisible) {
                return true;
            } else {
                return false;
            }

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
            //$scope.r88rResponse = $scope.initialR88rResponse;
            if(!$scope.scrollEventTriggered){
                $(".scrollBarWrapper").fadeIn("slow");
            }
            $scope.numberOfRows = 1;
            $("#row-toggle-button").hide();
            $scope.getSphereFeeds($("#breadcrumpSphereName").text());
            return $scope.r88rResponse;
        } else {
            $(".my-sphere-background").fadeOut();
            $("#viewAllSpheres").show();
            $(".sphere-top-img-static, .sphere-middle-img-static, .sphere-bottom-img-static").fadeIn();
            $("#breadcrumpSphereName").text($scope.preLoadedSpheres[currentSphereIndex].sphereName);
            $scope.getSphereFeeds($scope.preLoadedSpheres[currentSphereIndex].sphereName);
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

                var numSpheres = $scope.preLoadedSpheres.length;
                currentSphereIndex = (((currentSphereIndex + 1) % numSpheres) + numSpheres) % numSpheres;
                nextSphereUp = (((currentSphereIndex + 1) % numSpheres) + numSpheres) % numSpheres;
                $("#breadcrumpSphereName").text($scope.preLoadedSpheres[currentSphereIndex].sphereName);
                $("#fakeButton").click();

                $scope.newMiddleSphere = $(".sphere-top-img").attr("src");
                $scope.newBottomSphere = $(".sphere-middle-img").attr("src");
                $(".sphere-middle-img-static").attr("src", $scope.newMiddleSphere);
                $(".sphere-bottom-img-static").attr("src", $scope.newBottomSphere);
                $(".sphere-top-img-static").attr("src", $scope.preLoadedSpheres[nextSphereUp].src);
                
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

                var numSpheres = $scope.preLoadedSpheres.length;
                currentSphereIndex = (((currentSphereIndex - 1) % numSpheres) + numSpheres) % numSpheres;
                nextSphereDown = (((currentSphereIndex - 1) % numSpheres) + numSpheres) % numSpheres;
                $("#breadcrumpSphereName").text($scope.preLoadedSpheres[currentSphereIndex].sphereName);
                $("#fakeButton").click();

                $scope.newMiddleSphere = $(".sphere-bottom-img").attr("src");
                $scope.newTopSphere = $(".sphere-middle-img").attr("src");
                $(".sphere-middle-img-static").attr("src", $scope.newMiddleSphere);
                $(".sphere-bottom-img-static").attr("src", $scope.preLoadedSpheres[nextSphereDown].src);
                $(".sphere-top-img-static").attr("src", $scope.newTopSphere);

                $scope.staticSpheresReappear();

        });

        
        $(".sphere-bottom-img").animate({
            top: '25%'
        }, 1000);
    };


    document.addEventListener('wheel', function(e){
        if($(".sphere-middle-img-static").is(":visible") && !$scope.isAllSpheresVisible()){

            if((e.wheelDeltaY < -75 || e.deltaY < -75) && !$scope.scrollEventTriggered)
            {
                $scope.scrollUpSphere();
                $scope.scrollEventTriggered = true;

            } else if ((e.wheelDeltaY > 75 || e.deltaY > 75 ) && !$scope.scrollEventTriggered)
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
