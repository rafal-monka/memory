'use strict';

angular.module('GeolocApp.controllers.panel',[])
.controller('GeolocPanelCtrl', ['$scope', '$location', 'GeolocService', 'MapInitializer', function($scope, $location, GeolocService, MapInitializer) {
    $scope.svg_ready = [];    
    $scope.locations = [];
    $scope.y_altitude = [];
    $scope.routes = [];
    var filterPeriod = {
        from: null, 
        to: null
    };
    $scope.routeInfo = {};
   
    $scope.y_speed = [];
    $scope.sections = [];
    $scope.liveView = false;
    $scope.liveLastDeviceTime = null;
    $scope.liveGeolocs = [];
    
    var map;
    var markers = [];
    var areas = [];
    var paths = [];
    var CONST_ALTITUDE_EXPAND_SPAN = 0.90;

    
    $scope.availSize = Math.round(Math.min(screen.availWidth, screen.availHeight));
    $scope.svgHeigth = $scope.availSize*0.45; 
    $scope.svgWidth = $scope.availSize;
    
    $scope.auto_fit_bounds = true;
    
    //
    document.getElementById('map').setAttribute('style','height:'+($scope.availSize*0.8)+'px');
    document.getElementById('graph').setAttribute('style','height:'+($scope.svgHeigth+10+2)+'px; width:100%');  
//console.log('PANEL#'+'$scope.availSize='+$scope.availSize+' '+$scope.svgHeigth+' '+$scope.svgWidth); 

    $('#datetimepickerfrom').datetimepicker({
        format: 'YYYY-MM-DD HH:mm:ss',
        ignoreReadonly: true
    });
    $('#datetimepickerfrom').on("dp.change", function(e) {
        filterPeriod.from = $("#datetimepickerfrom").find("input").val();
    });   
                
    $('#datetimepickerto').datetimepicker({
        format: 'YYYY-MM-DD HH:mm:ss',
        ignoreReadonly: true
    });
    $('#datetimepickerto').on("dp.change", function(e) {
        filterPeriod.to = $("#datetimepickerto").find("input").val();
    });

    
    //utils 
    function toTimeString(seconds) {
        return (new Date(seconds * 1000)).toUTCString().match(/(\d\d:\d\d:\d\d)/)[0];
    };
    function getLength(date1, date2) {
        return (new Date(date2) - new Date(date1))/1000;
    };
        
    //read devices
    function readDevices() {
        $scope.device = { imei: null };
        GeolocService.getUserDevices().then(function(response){
            $scope.devices = response.data;
            for (var i=0; i < $scope.devices.length; i++) {
                if ($scope.devices[i].defaultdevice === 1) {
                    $scope.device.imei = $scope.devices[i].imei;
                }
            }
            if ($scope.device.imei !== null) {
                readSavedRoutes();            
            }
        });
    }
    //get routes
    function readSavedRoutes() {
        $scope.selected = { id: null };
        
        GeolocService.getSavedRoutes($scope.device.imei).then(function(response){
            $scope.routes = response.data;

            $scope.$watch('selected.id', function(newVal){                
                if (newVal !== null && newVal !== undefined) {
                    GeolocService.getSavedRoute(newVal.id).then(function(response){
                        $('#datetimepickerfrom')
                            .data({date: response.data.datefrom})
                            .datetimepicker('update')
                            .children('input')
                            .val(response.data.datefrom);                        
                        $('#datetimepickerto')
                            .data({date: response.data.dateto})
                            .datetimepicker('update')
                            .children('input')
                            .val(response.data.dateto);
                    filterPeriod = {
                        from: response.data.datefrom, 
                        to: response.data.dateto
                    };
                    $scope.routeInfo = response.data;
                    $scope.routeInfo.duration = getLength($scope.routeInfo.datefrom, $scope.routeInfo.dateto)
                    $scope.routeInfo.durationString = toTimeString($scope.routeInfo.duration);
                    $scope.routeInfo.pausetimeString = toTimeString($scope.routeInfo.pausetime);
                    refresh();
//alert(JSON.stringify(response.data));    
                    });
                }
            });            
            
        });
    }
    //initialize map    
    function showMap() {
        MapInitializer.mapsInitialized.then(function(){
            map = new google.maps.Map(document.getElementById('map'), {
                center: {
                    lat: 51.13611791, //###HOME
                    lng: 16.95349987  //###HOME
                },
                zoom: 16 
            });
        });
    }  
    
    function getSpeedColor(speed, alpha) {
	var color;// = GeolocApp.GUI_POLYLINE_COLOR;
	//speed in km/h
	if (speed === 0) {
            if (alpha <= 200) { //###@param
                color = "rgba( 200, 200, 200,"+alpha+")";
            } else {
                color = "rgba( 0,0,0,"+alpha+")";    
            }
	} else if (speed < 3) {
		color = "rgba( 204, 255, 204,"+alpha+")";
	} else if (speed < 10) {
		color = "rgba( 102, 255, 102,"+alpha+")";
	} else if (speed < 30) {
		color = "rgba( 255, 255, 153,"+alpha+")";
	} else if (speed < 50) {
		color = "rgba( 255, 255, 0,"+alpha+")";
	} else if (speed < 70) {
		color = "rgba( 255, 204, 128,"+alpha+")";
	} else if (speed < 90) {
		color = "rgba( 255, 163, 26,"+alpha+")";
	} else if (speed < 100) {
		color = "rgba( 255, 179, 179,"+alpha+")";
	} else if (speed < 120) {
		color = "rgba( 255, 77, 77,"+alpha+")";
	} else if (speed < 140) {
		color = "rgba( 255, 26, 26,"+alpha+")";
	} else if (speed < 160) {
		color = "rgba( 152, 152, 230,"+alpha+")";
	} else if (speed < 200) {
		color = "rgba( 70, 70, 210,"+alpha+")";
	} else if (speed < 250) {
		color = "rgba( 40, 40, 164,"+alpha+")";
	} else if (speed < 1500) {
		color = "rgba( 179, 0, 179,"+alpha+")";
	} else if (speed < 10000) {
	//    color = "rgba( 0,0,0,"+alpha+")";
	};
	return color;
    }
    
    function addMarker(geoloc, value) { 
        if (google !== undefined) {
console.log('addMarker()'+value);
console.log(geoloc);
            var speedFillColor = getSpeedColor(1*geoloc.speed, 255); //###@param
            var speedStrokeColor = getSpeedColor(1*geoloc.speed, 200); //###@param
            var marker = new google.maps.Marker({
                position: {lat: 1*geoloc.latitude, 
                           lng: 1*geoloc.longitude},
                map: map,
                icon: {
                  path: ((value===1) ? google.maps.SymbolPath.CIRCLE //(type===undefinded) ? google.maps.SymbolPath.CIRCLE : type,
                        : (value===2) ? google.maps.SymbolPath.BACKWARD_CLOSED_ARROW
                        : (value===3) ? google.maps.SymbolPath.BACKWARD_OPEN_ARROW : 0),
                  scale: 4 , 
                  fillColor: (value===1)?speedFillColor:'black', /*'white',*/
                  fillOpacity: 0.9,
                  strokeColor: speedStrokeColor, /*'#35ce9b',*/
                  strokeWeight: 3
                },
                /*label: label,
                labelClass: 'labels',*/
                title: '#'+geoloc.id+':'+geoloc.clientdata+'/alt='+Math.round(geoloc.altitude)+'/speed='+Math.round(geoloc.speed)+"/time="+geoloc.devicetime,
                zIndex: 0

            });
            markers.push(marker);

            //area
//console.log(geoloc.min_latitude +','+ geoloc.min_longitude +','+ geoloc.max_latitude +','+ geoloc.max_longitude);            
            if (geoloc.min_latitude !== undefined && geoloc.min_longitude !== undefined && geoloc.max_latitude !== undefined && geoloc.max_longitude !== undefined) {
                if (geoloc.min_latitude !== null && geoloc.min_longitude !== null && geoloc.max_latitude !== null && geoloc.max_longitude !== null) {
                    var rectangle = new google.maps.Rectangle({
                        strokeColor: 'orange',
                        strokeOpacity: 0.8,
                        strokeWeight: 1,
                        /*fillColor: '#FF0000',*/
                        fillOpacity: 0.02,
                        map: map,
                        bounds: {
                            north: geoloc.max_latitude,
                            south: geoloc.min_latitude,
                            east: geoloc.max_longitude,
                            west: geoloc.min_longitude
                        }
                    }); 
                    areas.push(rectangle);
                }
            }
        }
    }
    function addPath(geoloc1, geoloc2) {
            /*
            var lineSymbol = {
                path: google.maps.SymbolPath.FORWARD_OPEN_ARROW
            };
            */
            var speedFillColor = getSpeedColor((1*geoloc2.speed)/1, 200);
            var line = new google.maps.Polyline({
              path: [{lat: 1*geoloc1.latitude, lng: 1*geoloc1.longitude}, 
                     {lat: 1*geoloc2.latitude, lng: 1*geoloc2.longitude}],
              /*icons: [{
                icon: lineSymbol,
                offset: '100%'
              }],*/ 
              geodesic: true,
              strokeColor: speedFillColor,/*'#777',*/
              strokeOpacity: 0.95,
              strokeWeight: 6,
              map: map
            });
            paths.push(line);
    }
    
    // Sets the map on all markers in the array.
    function setMapOnAll(map) {
        for (var i = 0; i < markers.length; i++) {
          markers[i].setMap(map); 
        }
        for (var i = 0; i < paths.length; i++) {
          paths[i].setMap(map);
        }        
        for (var i = 0; i < areas.length; i++) {
          areas[i].setMap(map);
        }           
    }
    // Removes the markers from the map, but keeps them in the array.
    function clearMarkers() {
        setMapOnAll(null);
    }
    // Shows any markers currently in the array.
    //function showMarkers() {
    //    setMapOnAll(map);
    //}
    // Deletes all markers in the array by removing references to them.
    function deleteMarkers() {
        clearMarkers();
        markers = [];
        paths = [];
        areas = [];
    }  
    
    function getTimeInUnits(seconds, t) {
        var retV = '';
        var retU = '';
        if (seconds < 60) {                                        //seconds
            retV = seconds;
            retU = 'seconds';
        } else {
            if (seconds < (60*60)) {                               //minutes
                retV = Math.round((seconds/60)*10)/10;
                retU = 'minutes';
            } else {
                if (seconds < (24*60*60)) {                        //hours
                    retV = Math.round((seconds/(60*60))*10)/10;
                    retU = 'hours';
                } else {
                    if (seconds < (30*24*60*60)) {                //days
                        retV = Math.round((seconds/(24*60*60))*10)/10;
                        retU = 'days';
                    } else {  
                        if (seconds < (365*24*60*60)) {                //months
                            retV = Math.round((seconds/(30*24*60*60))*10)/10;
                            retU = 'months';
                        } else {                                       //years                        
                            retV= Math.round((seconds/(365*24*60*60))*10)/10;
                            retU = 'years';
                        }
                    }                    
                }
            }
        }
        switch (t) {
            case 'V': return retV; break;
            case 'U': return retU; break;                
        }
    }
        
    function myFitBounds(myMap, bounds) {
        myMap.fitBounds(bounds); // calling fitBounds() here to center the map for the bounds

        var overlayHelper = new google.maps.OverlayView();
        overlayHelper.draw = function () {
            if (!this.ready) {
                var extraZoom = getExtraZoom(this.getProjection(), bounds, myMap.getBounds());
                if (extraZoom > 0) {
                    myMap.setZoom(myMap.getZoom() + extraZoom);
                }
                this.ready = true;
                google.maps.event.trigger(this, 'ready');
            }
        };
        overlayHelper.setMap(myMap);
    }

    function getExtraZoom(projection, expectedBounds, actualBounds) {

        // in: LatLngBounds bounds -> out: height and width as a Point
        function getSizeInPixels(bounds) {
            var sw = projection.fromLatLngToContainerPixel(bounds.getSouthWest());
            var ne = projection.fromLatLngToContainerPixel(bounds.getNorthEast());
            return new google.maps.Point(Math.abs(sw.y - ne.y), Math.abs(sw.x - ne.x));
        }

        var expectedSize = getSizeInPixels(expectedBounds),
            actualSize = getSizeInPixels(actualBounds);

        if (Math.floor(expectedSize.x) == 0 || Math.floor(expectedSize.y) == 0) {
            return 0;
        }

        var qx = actualSize.x / expectedSize.x;
        var qy = actualSize.y / expectedSize.y;
        var min = Math.min(qx, qy);

        if (min < 1) {
            return 0;
        }

        return Math.floor(Math.log(min) / Math.LN2 /* = log2(min) */);
    }

    $scope.refresh = function() { 
        $scope.routeInfo = {};
        $scope.liveLastDeviceTime = null;
        $scope.liveGeolocs = [];    
        refresh();
    };
        
    function refresh() {
        
        if ($scope.device.imei === null || filterPeriod.from === null || filterPeriod.to === null) {
            return;
        }        
               
        var spd = 0.0;
        var limit = $scope.availSize;  
        $scope.speedLineWidth = "0px";

        GeolocService.retrivePanelData(
            $scope.device.imei,    
            filterPeriod.from,
            filterPeriod.to,
            limit
        ).then(function(data){    
            $scope.locations = data.data.locations;
            $scope.metadata = data.data.metadata;

            $scope.speedSpan = Math.round($scope.metadata[0].max_speed - 0); //km/h $scope.metadata[0].min_speed
            $scope.altitudeSpan = Math.max(10, Math.round(($scope.metadata[0].max_altitude - $scope.metadata[0].min_altitude*CONST_ALTITUDE_EXPAND_SPAN))); 
            if ($scope.locations.length > 0) {
                $scope.altitudeBarWidth = Math.max(1, Math.round($scope.availSize/$scope.locations.length)-1);
                $scope.speedLineWidth = Math.max(1, Math.min(3, Math.round($scope.availSize / $scope.locations.length)))+"px"; //)))+"px"; //Math.round(Math.min(7, Math.max(1, 
            }
            
            deleteMarkers();
                        
            $scope.metadata[0].span_devicetimeFormattedV = getTimeInUnits($scope.metadata[0].span_devicetime, 'V');
            $scope.metadata[0].span_devicetimeFormattedU = getTimeInUnits($scope.metadata[0].span_devicetime, 'U');

            //time frame sections
            $scope.sections = [];
            $scope.sections.push(0);                
            for (var i=1; i<Math.round($scope.metadata[0].span_devicetimeFormattedV); i++) {
                $scope.sections.push(Math.round(i / $scope.metadata[0].span_devicetimeFormattedV * $scope.svgWidth));
            }
            $scope.sections.push($scope.svgWidth);
            
//console.log('sections='+$scope.sections);
//console.log($scope.sections);
            var ds = $scope.svgHeigth / $scope.speedSpan;
            var da = $scope.svgHeigth / $scope.altitudeSpan;
            
            //Add path and scale values to chart size
            for (var i=0; i < $scope.locations.length; i++) {
                if (i===0) addMarker($scope.locations[i], 2);
                if (i===$scope.locations.length-1) addMarker($scope.locations[i], 3);
                $scope.locations[i].speed = $scope.locations[i].speed * 3.600;
                $scope.locations[i].max_speed = ($scope.locations[i].max_speed) * 3.600;
                spd += $scope.locations[i].speed;
                $scope.locations[i].avgSpeedScaled = Math.round(ds * ($scope.locations[i].speed));
                $scope.locations[i].maxSpeedScaled = Math.round(ds * ($scope.locations[i].max_speed));
                $scope.locations[i].avgAltitudeScaled = Math.round(da * ($scope.locations[i].altitude-$scope.metadata[0].min_altitude*CONST_ALTITUDE_EXPAND_SPAN));
//console.log('#locations['+i+'].altitudeScaled='+$scope.locations[i].altitudeScaled);
                $scope.locations[i].deviceTimeScaled = Math.round($scope.locations[i].rel_devicetime * $scope.svgWidth);                
                
                //add mark on map
                addMarker($scope.locations[i], 1);
                if (i>0) {
                    addPath($scope.locations[i-1], $scope.locations[i]);
                }
            }            

            //horizontal lines
            if ($scope.metadata[0].max_speed > 90) {
                $scope.y_speed_template = [10, 20, 50, 70, 90, 120, 140, 160, 180, 200, 220, 9999];
            } else {
                if ($scope.metadata[0].max_speed > 40) {
                    $scope.y_speed_template = [10, 20, 30, 50, 70, 90, 9999];
                } else {
                    if ($scope.metadata[0].max_speed >= 10) {
                        $scope.y_speed_template = [5, 10, 20, 30, 40, 9999];
                    } else {
                        $scope.y_speed_template = [1, 2, 3, 4, 5, 6, 7, 8, 9, 9999];
                    }
                }
            }
            $scope.y_altitude = [];
            $scope.y_speed = [];
            var d;
            var i;
            var vs;
//            var speed_lines = 4;
            var altitude_lines = 5;
//            d = Math.round($scope.speedSpan / speed_lines);
//console.log("#altitude:speedSpan/d="+d);
            i = 0;
            while ($scope.metadata[0].max_speed > $scope.y_speed_template[i]) {
                vs = Math.round(($scope.svgHeigth / $scope.speedSpan) * $scope.y_speed_template[i]);
                $scope.y_speed.push({y: vs, v: $scope.y_speed_template[i]});
                i++;
            }
//                vs = Math.round(($scope.svgHeigth / $scope.speedSpan) * (d*i));
//console.log("#altitude:speedSpan/vs="+vs);                
//                $scope.y_speed.push({y: vs, v: d*i});
//            }
            
            d = $scope.altitudeSpan/altitude_lines;
//console.log("#altitude:altitudeSpan/d="+d);            
            for (i=1; i<=altitude_lines; i++) {
                vs = Math.round(da * (d*i));
//console.log("#altitude:altitudeSpan/vs="+vs);                
                var vv = Math.round(d*i+$scope.metadata[0].min_altitude*CONST_ALTITUDE_EXPAND_SPAN);
                if (vv >= $scope.metadata[0].min_altitude) { //##depression
                    $scope.y_altitude.push({
                        y: vs, 
                        v: vv
                    });
                }
            }  
            //min altitude
            $scope.y_altitude.push({ 
                y: Math.round(da * ($scope.metadata[0].min_altitude-$scope.metadata[0].min_altitude*CONST_ALTITUDE_EXPAND_SPAN)), 
                v: Math.round($scope.metadata[0].min_altitude)
            });
//console.log("$scope.y_altitude="+$scope.y_altitude[0]+"|"+$scope.y_altitude[1]);
            
            if (1===1 && $scope.locations.length > 0) {
                $scope.metadata[0].avgSpeed = spd / $scope.locations.length;
                var center = new google.maps.LatLng(
                    $scope.locations[$scope.locations.length-1].latitude, 
                    $scope.locations[$scope.locations.length-1].longitude
                );
                //map.panTo(center);
                if ($scope.auto_fit_bounds) {
                    myFitBounds(map, 
                        new google.maps.LatLngBounds(
                            new google.maps.LatLng($scope.metadata[0].min_lat, $scope.metadata[0].min_lng),
                            new google.maps.LatLng($scope.metadata[0].max_lat, $scope.metadata[0].max_lng)
                        )
                    );
                }
            } else {
                $scope.metadata[0].avgSpeed = 0.0;
            }
            
//            var demo = {};
//            function init() {
//                demo.xAxis = 0;
//                demo.yAxis = 0;
//                demo.rectHeight = 50;
//                demo.rectWidth = 50;
//            }
//            init();            
//            $scope.svg_ready = [1];
        });        
    };
    showMap(); 
    readDevices();    
    //$scope.refresh();    
    
    //interactions        
    $scope.changeDevice = function() {
        //alert('changeDevice='+$scope.device.imei);
        
        //reload
        readSavedRoutes();
    };
    $scope.gotoMap = function() {
        $location.path('/map');
    };     
    
    //get livedata
    function getLiveData() {       
        //$scope.liveLastDeviceTime = "Reading...";
        GeolocService.getLiveData($scope.device.imei, $scope.liveLastDeviceTime).then(function(response){
            var obj = response.data;
// console.log('isArray='+angular.isArray(obj));            
            if (angular.isArray(obj)) { 
                var n = obj.length;
// console.log('obj.length='+n);                 
                if (n>0) {
// console.log('obj[n-1]='+obj[n-1]);                                                         
                    $scope.liveLastDeviceTime = obj[n-1].devicetime;
                    for (var i=0; i<n; i++) {
                        $scope.liveGeolocs.push(obj[i]);                        
//console.log('['+i+']='+obj[i]);
//console.log('$scope.liveGeolocs.length='+$scope.liveGeolocs.length);
                        //set markers on map
                        //last position
                        if ($scope.liveGeolocs.length===1) {
                            addMarker($scope.liveGeolocs[0], 2);                             
                        }

                        //first position
                        if ($scope.liveGeolocs.length===2) {
                            addMarker($scope.liveGeolocs[1], 3);    
                        }

                        //add path
                        if ($scope.liveGeolocs.length>1) {
                            addPath($scope.liveGeolocs[$scope.liveGeolocs.length-1], $scope.liveGeolocs[$scope.liveGeolocs.length-2]);                                                        
                        }
                    }
                    //move marker of last position
                    //###delete: addMarker($scope.liveGeolocs[$scope.liveGeolocs.length-1], 1);    
                    var latlng = new google.maps.LatLng($scope.liveGeolocs[$scope.liveGeolocs.length-1].latitude, $scope.liveGeolocs[$scope.liveGeolocs.length-1].longitude);
                    markers[0].setPosition(latlng);
                }
                
            }
        });
    }

    function retrieveLiveData() {
        if ($scope.liveView) {            
//console.log('retrieveLiveData...'+new Date());
            getLiveData();
            setTimeout(retrieveLiveData, 5000);
        }
    }
    $scope.live = function() {
        deleteMarkers();
        if ($scope.liveView) {
            $scope.liveView = false;
        } else {
            $scope.liveView = true;
            retrieveLiveData();
        }        
    }
}]);