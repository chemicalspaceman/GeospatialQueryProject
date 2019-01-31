//Define a bunch of global variable for dataframe set up
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
var distancePos;
var timePos;
var withinHours = 3; //How recent you would like the data to be (Hours)
var withinMiles = 100; //How far away would you like to see data from (miles)
var result = new Array();
var dataFrame = new Array();

//Submission form and map variables
var latLong = new Array();
latLong[0] = 50.2839 // MSW Latitude
latLong[1] = -3.7775 // MSW Longitude
var mymap = L.map('mapid').setView([latLong[0], latLong[1]], 7.5);
var marker = {};
var circle = {};
var mInMile = 1609.344;

//Register map click event
mymap.on('click', onMapClick);

//Initialize map drawing
drawMap();

	
function drawMap(){
	//close previous popups
	mymap.closePopup(popup);
	
	//Use fly animation to new latlng
	mymap.flyTo([latLong[0], latLong[1]]);

	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		maxZoom: 18,
		id: 'mapbox.streets',
		accessToken: 'pk.eyJ1IjoiY2hlbWljYWxzcGFjZW1hbiIsImEiOiJjanJna2U3NnIxNjBkNDRvZ2ZlaHFxdHh1In0.opUnKNO3WAOLCcspchY0Zg'
	}).addTo(mymap);

	//Remove any previous location marker	
	if(marker != undefined){
		mymap.removeLayer(marker);
	}

	//Draw new marker
	marker = L.marker([latLong[0], latLong[1]]).addTo(mymap);
	//marker.bindPopup("<b>Your chosen location!</b>").openPopup();

	//Remove any previous location circle
	if(circle != undefined){
		mymap.removeLayer(circle);
	}

	//Draw new circle
	circle = L.circle([latLong[0], latLong[1]], {
    color: 'rgba(250,42,0,0.6)',
    fillColor: '#F3DAD5',
    fillOpacity: 0.3,
    radius: (20+withinMiles)*mInMile //Added 20 miles, is a bit cheeky but circle so large curve of earth sometimes effecting containment
	}).addTo(mymap);

	//Draw popups for all stations within range
	for(var i = 0; i<dataFrame.length;i++){
		if(i==0){
			var popup = L.popup({
				maxWidth: 60,
				maxHeight: 50})
				.setLatLng([dataFrame[i][latPos], dataFrame[i][lonPos]])
				.setContent("<dl><dt>Station:</dt>" + "<dd>" + dataFrame[i][stationPos] + "</dd></d1>")
				.openOn(mymap);
		}
		else{
			var popup = L.popup({
				maxWidth: 60,
				maxHeight: 50})
				.setLatLng([dataFrame[i][latPos], dataFrame[i][lonPos]])
				.setContent("<dl><dt>Station:</dt>" + "<dd>" + dataFrame[i][stationPos] + "</dd></d1>")
				.addTo(mymap);

			//Can add distance inside popup using "<dt>Distance:</dt>" + "<dd>" + dataFrame[i][distancePos] + " Miles" (looks neater without)
		}
	}
}


//Alert user of latitude and longitude on map click
function onMapClick(e) {
	//swal("You clicked the map at:", " " + e.latlng, "info");

	//Take user click info and find relevant observations
	latLong[0] = e.latlng.lat;
	latLong[1] = e.latlng.lng;

	//Write latlng in 'your location' section
	let lat = latLong[0];
    let long = latLong[1];

    //2 decimal places to display above button
    latText.innerText = lat.toFixed(3);
    longText.innerText = long.toFixed(3);

	createDataframe();
 	drawMap();
}

	
//API to fetch data from NBDC 
fetch('https://cors-anywhere.herokuapp.com/http://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt').then(function(response) {
	return response.text().then(function(text) {
		process_response(text);
	});
});


//Alert user once the latest data has been imported and preprocess import
function process_response(text){
	swal("All Done!", "The latest NDBC data has been successfully loaded","success",{button:"Let's Go",
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
	timePos = result.indexOf("VIS"); //Going to overwrite the VIS column
	distancePos = result.indexOf("TIDE"); //Going to overwrite the TIDE column
		
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


		//Overwriting the unused "TIDE" and "VIS" columns to keep distances and times
		dataFrame[i][distancePos] = distDiff;
		dataFrame[i][timePos] = checkDate.toLocaleString();

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
		//Turn degrees to radians
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;

		//Find difference and direction
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;

		//Variation of the Haversine formula to calculate as crow flies globe distances using (re)versed sine
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);

		//Turn distance into miles
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;

		//Functionality to check Kilometers or Nautical miles
		if (unit=="K"){dist = dist * 1.609344 }
		if (unit=="N"){dist = dist * 0.8684 }
		return dist;
	}
}


function submitter() {

	//On button click take value and find observations from form input
 	latLong[0] = document.getElementById("lat").value;
 	latLong[1] = document.getElementById("lon").value;

 		//Write latlng in 'your location' section
	let lat1 = parseFloat(latLong[0]);
    let long1 = parseFloat(latLong[1]);

    //2 decimal places to display above button
    latText.innerText = lat1.toFixed(3);
    longText.innerText = long1.toFixed(3);

    //Error messages if not in range or NaN
 	if(latLong[0]< -90 || latLong[0] > 90 || latLong[1]< -180 || latLong[1] > 180){
 		swal("Input Not In Range","-90 < Latitude < 90 AND -180 < Longitude < 180", "error",{button:"My Bad",})
 	}
 	else if(isNaN(lat1) || isNaN(long1)){
 		swal("Input Must Be A Number","-90 < Latitude < 90 AND -180 < Longitude < 180", "error",{button:"My Bad",})
 	}
 	else{
 		createDataframe();
 		drawMap();
 	}
}


function buildTable() {
  	var table = document.getElementById("dataTable");

  	//Delete current table
  	var currentRows = table.rows.length;
  	for(var i = currentRows-1; i>=0; i--){
  		//if(i < table.rows.length){
  			table.deleteRow(i);
  		//}
  	}

  	//Rebuild table
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
  		var timeValue = row.insertCell(10);

  		stationValue.innerHTML = dataFrame[i][stationPos];
  		latitudeValue.innerHTML = dataFrame[i][latPos];
  		longitudeValue.innerHTML = dataFrame[i][lonPos];
  		windDirValue.innerHTML = dataFrame[i][windDirPos];
  		windSpeedValue.innerHTML = dataFrame[i][windSpeedPos];
  		waveHeightValue.innerHTML = dataFrame[i][waveHeightPos];
  		averagePerValue.innerHTML = dataFrame[i][averagePerPos];
  		airTempValue.innerHTML = dataFrame[i][airTempPos];
  		waterTempValue.innerHTML = dataFrame[i][waterTempPos];
  		distanceValue.innerHTML = dataFrame[i][distancePos].toFixed(2);
  		timeValue.innerHTML = dataFrame[i][timePos];
	}	
}

//Handle geolocation
let latText = document.getElementById("latitude");
let longText = document.getElementById("longitude");

//On "Get My Location" button click
function getLocation(){
	//Get location if possible and showPosition()
	if (navigator.geolocation) {
    	navigator.geolocation.getCurrentPosition(showPosition);
  	} 
  	else{
  		//Display an error if not supported
    	swal("Geolocation is not supported by this browser.","Sorry","error");
  	}
}


function showPosition(position){
    let lat = position.coords.latitude;
    let long = position.coords.longitude;

    //2 decimal places to display above button
    latText.innerText = lat.toFixed(3);
    longText.innerText = long.toFixed(3);

    //Find observations near location
    latLong[0] = lat;
 	latLong[1] = long;

 	createDataframe();
 	drawMap();
}

// Scroll to the top of the page
function topFunction() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}


console.log("Weather and wave data visualiser - Matthew Bailey")