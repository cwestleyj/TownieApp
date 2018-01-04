/**
 * Created by Tyler on 4/22/2016.
 */


//Scroll function for shrinking logo

$(function () {
    $('#logo').data('size', 'big');
});

$(window).scroll(function () {
    if ($(document).scrollTop() > 0) {
        if ($('#logo').data('size') == 'big') {

            $('#logo').data('size', 'small');
            $('#logo').stop().animate({
                height: '10%'
            }, 600);
        }

    }
    else {
        if ($('#logo').data('size') == 'small') {
            $('#logo').data('size', 'big');
            $('#logo').stop().animate({
                height: '20%'
            }, 600);
        }
    }
});
//end scroll function


//functions for navigation arrows
$("#arrow").click(function (e) {
    $('html, body').animate({
        scrollTop: $("#sketchpadSection").offset().top

    }, 800);

});

$("#arrow2").click(function (e) {
    $('html, body').animate({
        scrollTop: $("#gallery").offset().top

    }, 800);

});

$("#logo").click(function (e) {
    $('html, body').animate({
        scrollTop: $("body").offset().top

    }, 800);

});

//end navigation arrows functions



//function fireScroll() {
//    window.addEventListener('scroll', function (e) {
//        var distanceY = window.pageYOffset || document.documentElement.scrollTop,
//            shrinkOn = 300;
//    });
//}
//window.onload = fireScroll();


var db, map, infoWindow, sketchController,
    markers = [],
    drawingColor = "#000";

//setup db
db = new Dexie("paintings");
db.version(1).stores({drawings: "++id,time,lat,long"});
db.open();

//call the init function straightaway
init();

function init() {

    //make it so we can draw on the sketchpad canvas
    sketchController = $("#sketchpad").sketch().data("sketch");

    //add event listeners to drawing tools
    $("#colorpicker").on("input", setDrawingColor);
    $("#sizepicker").on("input", setDrawingSize);
}

//drawing tool event handlers
function setDrawingColor(event) {
    sketchController.color = this.value;
}

function setDrawingSize(event) {
    sketchController.size = this.value;
}

$("#btnSave").click(function () {

    //get a reference to our canvas
    var canvas = document.getElementById("sketchpad");

    //make the object to put into our object store
    var drawingData = {
        time: Date.now(),
        pixelData: canvas.toDataURL()
    }

    function getLocationOnSaveCallBack(location) {
        var lat, long;
        if (location.coords) {
            lat = location.coords.latitude;
            long = location.coords.longitude;
        }
        drawingData.lat = lat;
        drawingData.long = long;

        // save to the database
        db.drawings.add(drawingData).then(listDrawings);
    }

    // get the user's location
    navigator.geolocation.getCurrentPosition(getLocationOnSaveCallBack, getLocationOnSaveCallBack);

    //add that drawing to the data store



    //Show arrow div guiding user down after #btnsave call

    $("#sketch-copy").append("<p>Looks good, champ! We added it to the list. View it in the Gallery!");
    document.getElementById("arrow2").style.display = "block";

    //clear the canvas
})

$('#timeSpan').change(function () {
    showLocations();
});

//list all the drawings on the righthand side..
function listDrawings() {
    var drawingListingDiv = $("#drawingListing");

    //clear out the old content
    drawingListingDiv.html("");

    db.drawings.each(function (drawing) {
        var drawingDate = new Date(drawing.time);



        //<br/>
        //<i id="arrow2" class=" fa fa-arrow-circle-down fa-2x" aria-hidden="true"><br/></i>

        drawingListingDiv.append("<li class='paintings' onclick='showDrawing(" + drawing.id + ")'>" + drawingDate.toString() + "</li>");


    })
}

function showDrawing(id) {
    db.drawings.get(id).then(function (result) {

        //creat a new image
        var cvEl = document.createElement("img");

        //make it display our data url image
        cvEl.src = result.pixelData;

        //put that image onto the page
        $("#drawingShowcase").html(cvEl);

    })
}

function SetInfoPanelToDrawing(id) {
    db.drawings.get(id).then(function (result) {

        //creat a new image
        var cvEl = document.createElement("img");

        //make it display our data url image
        cvEl.src = result.pixelData;

        //put that image onto the page
        infoWindow.setContent(cvEl);

    })
}

function initMap() {

    //this is where we actually crate the happy little google map
    map = new google.maps.Map(
        document.getElementById("map"),
        {
            center: {lat: -34.397, lng: 150.644},
            zoom: 8
        }
    );
    infoWindow = new google.maps.InfoWindow({
        content: null
    });

    //can I geolocate this device?
    if (navigator.geolocation) {
        //if i can
        navigator.geolocation.getCurrentPosition(function (position) {

            //store the location of this user..
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            //center on the user's location
            map.setCenter(userLocation);

            //show saved locations
            showLocations();

        })
    }

}

function showLocations() {

    // remove any existing markers
    clearMarkers();

    var timeSpan = document.getElementById("timeSpan").value;

    var minDate = null;

    if (timeSpan == "last3days") {
        minDate = new Date();
        minDate.setDate(minDate.getDate() - 3);
        minDate.setHours(0, 0, 0, 0);
    }
    else if (timeSpan == "last7days") {
        minDate = new Date();
        minDate.setDate(minDate.getDate() - 7);
        minDate.setHours(0, 0, 0, 0);
    }
    else if (timeSpan == "last30days") {
        minDate = new Date();
        minDate.setDate(minDate.getDate() - 30);
        minDate.setHours(0, 0, 0, 0);
    }

    db.drawings.each(function (drawing) {
        var drawingDate = new Date(drawing.time);

        // Only show drawings > min date
        if (drawingDate > minDate) {
            var marker = new google.maps.Marker({
                position: {lat: drawing.lat, lng: drawing.long},
                map: map,
                //title: location.title,
                animation: google.maps.Animation.DROP,
                drawing: drawing
            });
            markers.push(marker);

            marker.addListener('click', function () {
                var drawing = this.drawing;
                //showDrawing(drawing.id);
                SetInfoPanelToDrawing(drawing.id);
                //infoWindow.setContent
                infoWindow.open(map, marker);
            });
        }
    });
}

function clearMarkers() {
    markers.forEach(function (marker) {
        marker.setMap(null);
    });
    markers = [];
}