//Define a bunch of global variable for dataframe set up
var plotDist;
var noRows;
var noCols;
var dataRows;
var dataCols; 
var stationPos;
var latPos;
var lonPos;
var yearPos;
var monthPos;
var dayPos;
var hourPos;
var minutePos;
var windDirPos;
var windSpeedPos;
var waveHeightPos;
var averagePerPos
var airTempPos;
var withinHours = 3; //How recent you would like the data to be (Hours)
var withinMiles = 100; //How far away would you like to see data from (miles)
var result = new Array();
var dataFrame = new Array();

//Submission form and map variables
var latLong = new Array();
latLong[0] = 50.2839 // MSW Latitude
latLong[1] = -3.7775 // MSW Longitude
var mymap = L.map('mapid').setView([latLong[0], latLong[1]], 8);
var marker = {};
var circle = {};
var mInMile = 1609.34;

//Map click event
mymap.on('click', onMapClick);

//Initialize map drawing
drawMap();

	
function drawMap(){

	mymap.closePopup();
	mymap.flyTo([latLong[0], latLong[1]]);

	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		maxZoom: 18,
		id: 'mapbox.streets',
		accessToken: 'pk.eyJ1IjoiY2hlbWljYWxzcGFjZW1hbiIsImEiOiJjanJna2U3NnIxNjBkNDRvZ2ZlaHFxdHh1In0.opUnKNO3WAOLCcspchY0Zg'
	}).addTo(mymap);

		
	if(marker != undefined){
		mymap.removeLayer(marker);
	}

	marker = L.marker([latLong[0], latLong[1]]).addTo(mymap);
	marker.bindPopup("<b>This is you!</b><br>Right here.").openPopup();

	if(circle != undefined){
		mymap.removeLayer(circle);
	}
		
	circle = L.circle([latLong[0], latLong[1]], {
    color: 'rgba(250,42,0,0.6)',
    fillColor: '#F3DAD5',
    fillOpacity: 0.3,
    radius: withinMiles*mInMile
	}).addTo(mymap);

	for(var i = 0; i<dataFrame.length;i++){
		if(i==0){
			var popup = L.popup()
				.setLatLng([dataFrame[i][latPos], dataFrame[i][lonPos]])
				.setContent("<dl><dt>Station:</dt>" + "<dd>" + dataFrame[i][stationPos] + "</dd>" + "<dt>Distance:</dt>" + "<dd>" + plotDist + " Miles" + "</dd>")
				.openOn(mymap);
		}
		else{
			var popup = L.popup()
				.setLatLng([dataFrame[i][latPos], dataFrame[i][lonPos]])
				.setContent("<dl><dt>Station:</dt>" + "<dd>" + dataFrame[i][stationPos] + "</dd>" + "<dt>Distance:</dt>" + "<dd>" + plotDist + " Miles" + "</dd>")
				.addTo(mymap);
		}
	}
}


//Alert user of latitude and longitude on map click
function onMapClick(e) {
	swal("You clicked the map at:", " " + e.latlng, "info");
}

	
//API to fetch data from NBDC 
fetch('https://cors-anywhere.herokuapp.com/http://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt').then(function(response) {
	return response.text().then(function(text) {
		process_response(text);
	});
});


//Alert user once the latest data has been imported and preprocess import
function process_response(text){
	swal("All done!", "The latest NDBC data has been successfully loaded","success",{button:"Let's go",
		});

	//Removes all 'next line' commands from text
	text = text.replace(/(\r\n|\n|\r)/gm," ")
	var output = String(text);
	stringSplit(output);
}


function stringSplit(str){
	//Splits the string into an array of its components
	var res = str.split(" ");
	var j = 0;

	for(var i = 0; i < res.length; i++){
		if(res[i]!==""){
			//Remove all blank elements of array
			result[j] = res[i];

			//Change all MM's to the universally recognised "-"
			if(result[j]=="MM"){
				result[j] = "-";
			}
			j++
		}		
	}

	result[0][noCols-1] = "DST";
	createDataframe();
}


function createDataframe(){
	//Get column positions of all 'important' information
	noCols = result.indexOf("#text");
	noRows = result.length/noCols;
	stationPos = result.indexOf("#STN");
	latPos = result.indexOf("LAT");
	lonPos = result.indexOf("LON");
	yearPos = result.indexOf("YYYY");
	monthPos = yearPos + 1;
	 dayPos = result.indexOf("DD");
	hourPos = result.indexOf("hh");
	minutePos = result.indexOf("mm");
	windDirPos = result.indexOf("WDIR");
	windSpeedPos = result.indexOf("WSPD");
	waveHeightPos = result.indexOf("WVHT");
	averagePerPos = result.indexOf("APD");
	airTempPos = result.indexOf("ATMP");
	waterTempPos = result.indexOf("WTMP");
	distancePos = result.indexOf("DST");

		
	//Removes first 2 rows (Headings and units) and separates each station
	var j = 0;
	for(var i = 2; i<noRows; i++){
		dataFrame[j] = result.slice(i*noCols,(i+1)*noCols);
		j++
	}
	//Account for the 2 deleted rows
	noRows = noRows-2;

	//Remove row if observation not within last 3 hours
	var now = new Date();
	var Arr = new Array();

	//Running for loop in reverse due to splice command (could also decrement i inside if statement)
	for(var i = noRows-1; i>=0; i--){
		var checkDate = new Date(dataFrame[i][yearPos]+"-"+dataFrame[i][monthPos]+"-"+dataFrame[i][dayPos]+"T"+dataFrame[i][hourPos]+":"+dataFrame[i][minutePos]+"Z");

		// Give the difference in milliseconds (1/1000 of a second)
		var timeDiff = Math.abs(now-checkDate);
		var loopLat = parseInt(dataFrame[i][latPos]);
		var loopLon = parseInt(dataFrame[i][lonPos]);
			
		var distDiff = geospatialQuery(latLong[0],latLong[1],loopLat,loopLon,"M");

		//Overwriting the unused "TIDE" column to keep distances from marker
		dataFrame[i][distancePos] = distDiff;

		//Remove rows
		if(timeDiff>(1000*60*60*withinHours)){
			//Remove row if data ikdr than 3 hours
			dataFrame.splice(i,1);
		}
		else if(distDiff>100){
			//Remove row if not within 100 miles
			dataFrame.splice(i,1);
		}
	}
		//Adjust number of rows occordingly
	noRows = dataFrame.length;
		
	buildTable();	
}


function geospatialQuery(lat1, lon1, lat2, lon2, unit) {
	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		
		if (dist > 1) {
			dist = 1;
		}

		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;

		//Functionality to check Kilometers or Nautical miles
		if (unit=="K"){dist = dist * 1.609344 }
		if (unit=="N"){dist = dist * 0.8684 }
		return dist;
	}
}


function submitter() {
 	latLong[0] = document.getElementById("lat").value;
 	latLong[1] = document.getElementById("lon").value;

 	createDataframe();
 	drawMap();
}


function buildTable() {
  	var table = document.getElementById("dataTable");

  	for(var i = 0; i<table.rows.length; i++){
  		if(i < table.rows.length){
  			table.deleteRow(i);
  		}
  	}


  	for(var i = 0; i<dataFrame.length; i++){
  		var row = table.insertRow(i);
  		var stationValue = row.insertCell(0);
  		var latitudeValue = row.insertCell(1);
  		var longitudeValue = row.insertCell(2);
  		var windDirValue = row.insertCell(3);
  		var windSpeedValue = row.insertCell(4);
  		var waveHeightValue = row.insertCell(5);
  		var averagePerValue = row.insertCell(6);
  		var airTempValue = row.insertCell(7);
  		var waterTempValue = row.insertCell(8);
  		var distanceValue = row.insertCell(9);

  		stationValue.innerHTML = dataFrame[i][stationPos];
  		latitudeValue.innerHTML = dataFrame[i][latPos];
  		longitudeValue.innerHTML = dataFrame[i][lonPos];
  		windDirValue.innerHTML = dataFrame[i][windDirPos];
  		windSpeedValue.innerHTML = dataFrame[i][windSpeedPos];
  		waveHeightValue.innerHTML = dataFrame[i][waveHeightPos];
  		averagePerValue.innerHTML = dataFrame[i][averagePerPos];
  		airTempValue.innerHTML = dataFrame[i][airTempPos];
  		waterTempValue.innerHTML = dataFrame[i][waterTempPos];

  		var d1 = parseInt(dataFrame[i][distancePos]);
  		plotDist = Math.round(d1);
  		distanceValue.innerHTML = plotDist;
	}
}