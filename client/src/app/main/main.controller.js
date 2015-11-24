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
    setTimeout(function(){ 
        $("#splashScreen").hide();
     }, 4000);

    $scope.preLoadedSpheres = 
    [
        {
            "src":"/assets/images/cryosphere.png",
            "sphereName": "Cryosphere"
        } ,
        {
            "src":"/assets/images/atmosphere.png",
            "sphereName": "Atmosphere"
        } ,
        {
            "src":"/assets/images/forests.png",
            "sphereName": "Forest"
        } , 
        {
            "src":"/assets/images/pollution.png",
            "sphereName": "Pollution"
        } , 
        {
            "src":"/assets/images/agriculture.png",
            "sphereName": "Agriculture"
        } , 
        {
            "src":"/assets/images/education.png",
            "sphereName": "Education"
        } , 
        {
            "src":"/assets/images/built-env.png",
            "sphereName": "Built Environment"
        } , 
        {
            "src":"/assets/images/energy.png",
            "sphereName": "Energy"
        } ,
        {
            "src":"/assets/images/oceans.png",
            "sphereName": "Hydrosphere"
        } 
    ]

    var feeds = 
    [
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.geology",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.climate",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.energy",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.government",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.landscape",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.math",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.oceans",

        "http://v3.api.r88r.net/v3/headlines?cname=V3A.architecture",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.bioinformatics",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.education",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.educationpolicy",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.electricvehicles",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.localfood",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.architecture",

        "http://v3.api.r88r.net/v3/headlines?cname=V3A.automotive",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.biodiversity",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.buddhism",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.careers",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.chefs",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.culture",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.dairy",

        "http://v3.api.r88r.net/v3/headlines?cname=V3A.environment",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.farming",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.gardening",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.greenhome",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.herbal",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.immigration",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.jazz",

        "http://v3.api.r88r.net/v3/headlines?cname=V3A.oil",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.organicgardening",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.progressive",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.rainforest",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.science",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.startups",
        "http://v3.api.r88r.net/v3/headlines?cname=V3A.transportation"
    ]

    var currentSphereIndex = 1;
    var nextSphereUp = 2;
    var nextSphereDown; // = $scope.preLoadedSpheres[$scope.preLoadedSpheres.length - 1];
    $scope.allSpheresVisible = false;



    //This is jQuery, try not to mix angular and jquery when possible, because
    // they both do DOM manipulation.
    $(".sphere-top-img-static").attr("src", $scope.preLoadedSpheres[currentSphereIndex + 1].src);
    $(".sphere-middle-img-static").attr("src", $scope.preLoadedSpheres[currentSphereIndex].src);
    $(".sphere-bottom-img-static").attr("src", $scope.preLoadedSpheres[currentSphereIndex - 1].src);
    //$(".sphere-bottom-img-static").attr("src", $scope.preLoadedSpheres[$scope.preLoadedSpheres.length - 1].src);

    $scope.optionsNowVisible = false;

    //Couldn't get Angular to update the dom when switching spheres.  So frustrating.
    //$scope.breadcrumbSphere = $scope.preLoadedSpheres[currentSphereIndex].sphereName;
    $("#breadcrumpSphereName").text($scope.preLoadedSpheres[currentSphereIndex].sphereName);

    $scope.backgroundcolor = 'white';
    $scope.backgroundimage= 'full';
    $scope.visibleStory = "";
    $scope.mySavedStories = [];
    $scope.numberOfRows = 1;
    $scope.initialR88rResponse = [
        {
        headline:
            "Geology",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.geology",
        img:{src:
            "/assets/images/Cool_Geological_Layering.jpg"}
        },
        {
        headline:
            "Climate",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.climate",
        img:{src:
            "/assets/images/cloud-cover-climate.jpg"}
        },
        {
        headline:
            "Energy",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.energy",
        img:{src:
            "/assets/images/energy-feed.jpg"}
        },
        {
        headline:
            "Government",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.government",
        img:{src:
            "/assets/images/capitoldomeban.jpg"}
        },
        {
        headline:
            "Landscape",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.landscape",
        img:{src:
            "/assets/images/1024px-Balaton_Hungary_Landscape.jpg"}
        },
        {
        headline:
            "Math",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.math",
        img:{src:
            "/assets/images/1011math.jpg"}
        },
        {
        headline:
            "Oceans",    
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.oceans",
        img:{src:
            "/assets/images/Atlantic-Ocean.jpg"}
        },
        {
        headline:
            "Architecture ",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.architecture",
        img:{src:
            "/assets/images/lacubo01.jpg"}
        },
        {
        headline:
            "Bioinformatics",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.bioinformatics",
        img:{src:
            "/assets/images/cropped-dna.jpg"}
        },
        {
        headline:
            "Education",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.education",
        img:{src:
            "/assets/images/6357758756001800821152486765_State-Education---Generic-jpg.jpg"}
        },
        {
        headline:
            "Education Policy",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.educationpolicy",
        img:{src:
            "/assets/images/pencilgraphdown_jpg_800x1000_q100.jpg"}
        },
        {
        headline:
            "Electric Vehicles",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.electricvehicles",
        img:{src:
            "/assets/images/electric-car-electric-vechile-EV.jpg"}
        },
        {
        headline:
            "Local Food",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.localfood",
        img:{src:
            "/assets/images/local-food (1).jpg"}
        },
        {
        headline:
            "Architecture",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.architecture",
        img:{src:
            "/assets/images/lacubo01.jpg"}
        },
        {
        headline:
            "Automotive",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.automotive",
        img:{src:
            "/assets/images/sap-erp-automotive.jpg"}
        },
        {
        headline:
            "Buddhism",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.buddhism",
        img:{src:
            "/assets/images/buddhism-feed.jpg"}
        },
        {
        headline:
            "Careers",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.careers",
        img:{src:
            "/assets/images/palyavalasztas.png"}
        },
        {
        headline:
            "Chefs",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.chefs",
        img:{src:
            "/assets/images/pic-12.jpg"}
        },
        {
        headline:
            "Culture",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.culture",
        img:{src:
            "/assets/images/flags_world.jpg"}
        },
        {
        headline:
            "Dairy",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.dairy",
        img:{src:
            "/assets/images/dairy-fat-study-image.jpeg"}
        },
        {
        headline:
            "Environment",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.environment",
        img:{src:
            "/assets/images/environment-feed.jpg"}
        },
        {
        headline:
            "Farming",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.farming",
        img:{src:
            "/assets/images/Farm-Equipment.jpg"}
        },
        {
        headline:
            "Gardening",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.gardening",
        img:{src:
            "/assets/images/gardening-001-640x320.jpg"}
        },
        {
        headline:
            "Green Home",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.greenhome",
        img:{src:
            "/assets/images/green-home-designs-550x388-on-home-designfantastic.jpg"}
        },
        {
        headline:
            "Herbal",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.herbal",
        img:{src:
            "/assets/images/Adrenal_Fatigue_herbal_therapy.png"}
        },
        {
        headline:
            "Immigration",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.immigration",
        img:{src:
            "/assets/images/keep-families-together.jpg"}
        },
        {
        headline:
            "Jazz",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.jazz",
        img:{src:
            "/assets/images/480x374xsatchmo-club-hangover-e1367196787338.jpg.pagespeed.ic.ycQr0BFuvN.jpg"}
        },
        {
        headline:
            "Oil",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.oil",
        img:{src:
            "/assets/images/oil-feed.jpg"}
        },
        {
        headline:
            "Organic Gardening",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.organicgardening",
        img:{src:
            "/assets/images/full-size.jpg"}
        },
        {
        headline:
            "Biodiversity",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.biodiversity",
        img:{src:
            "/assets/images/biodiversity_438x0_scale.jpg"}
        },
        {
        headline:
            "Progressive",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.progressive",
        img:{src:
            "/assets/images/131527463_640.jpg"}
        },
        {
        headline:
            "Rain Forest",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.rainforest",
        img:{src:
            "/assets/images/iStock_000013346231Small(2)_ZqCncpxyzB_l.png"}
        },
        {
        headline:
            "Startups",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.startups",
        img:{src:
            "/assets/images/video.yahoofinance.com@a3be196f-5e8c-32ba-a533-dfb288d4962c_FULL.jpg"}
        },
        {
        headline:
            "Transportation",
        url:
            "http://v3.api.r88r.net/v3/headlines?cname=V3A.transportation",
        img:{src:
            "/assets/images/RapidTransit1.png"}
        }

    ]

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
                        $scope.initialR88rResponse[15],
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
                        $scope.initialR88rResponse[9],
                        $scope.initialR88rResponse[10],
                        $scope.initialR88rResponse[16],
                        $scope.initialR88rResponse[31]];
                break;
            case "Built Environment":
                $scope.r88rResponse =  [$scope.initialR88rResponse[4],
                        $scope.initialR88rResponse[7],
                        $scope.initialR88rResponse[11],
                        $scope.initialR88rResponse[14],
                        $scope.initialR88rResponse[18],
                        $scope.initialR88rResponse[32]];
                break;
            case "Energy":
                $scope.r88rResponse =  [$scope.initialR88rResponse[8],
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

    $scope.getSphereFeeds("Atmosphere");

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
