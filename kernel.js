var getUrlParams = function () {
    var params = {};
    var search = window.location.search;
    if (search) {
        search = search.split('?')[1];
        if (search) {
            var paramStrings = search.split('&');
            for(var i in paramStrings){
                var string = paramStrings[i];
                var pair = string.split('=');
                params[pair[0]] = pair[1];
            }
        }
    }
    return params;
};


var params = getUrlParams();

var frameEach = 0; //in millis
var tileWidth =  params['tiles'] ? parseInt(params['tiles'],10) : 128;
var tileHeight = params['tiles'] ? parseInt(params['tiles'],10) : 128;

var cropCanvas = document.getElementById("crop1");
cropCanvas.width = tileWidth;
cropCanvas.height = tileHeight;
var cropCtx = cropCanvas.getContext('2d');


var tiles = {};
var tilesLoaded = 0;
var speed = document.getElementById("speed");

var loaderCallback = function () {
    if (++tilesLoaded === xTileCount * yTileCount) {
        console.time("render");
        cropCanvas.hidden = true;
        render();
        setInterval(function(){
            speed.innerHTML = getAvgFrameTime() + " ms<br/> Tile Dim: "+tileWidth;
        },2000);
    }
};

var addTile = function (x, y) {
    console.log("Adding Tile:" + x + " " + y);
    var img = tiles[x + "-" + y] = new Image();
    img.onload = loaderCallback;
    img.src = cropCanvas.toDataURL();
};

var startCropping = function () {
    xTileCount = Math.floor(map.width / cropCanvas.width);
    yTileCount = Math.floor(map.height / cropCanvas.height);

    for (var x = 0; x < xTileCount; x++) {
        for (var y = 0; y < yTileCount; y++) {
            cropCtx.drawImage(map, x * cropCanvas.width, y * cropCanvas.height, cropCanvas.width, cropCanvas.height, 0, 0, cropCanvas.width, cropCanvas.height);
            addTile(x, y);
        }
    }
};

var map = new Image();
map.onload = startCropping;
map.src = 'map.png';



var canvas = document.getElementById('c1');


canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var ctx = canvas.getContext('2d');
var startPoint;
var mapOffset = {
    x: 0,
    y: 0
};

var scrollOffset = {
    x: 0,
    y: 0
};

var lastShift = {
    x: 0,
    y: 0
};

canvas.addEventListener("mousedown", function (e) {
    startPoint = {
        x: e.pageX,
        y: e.pageY
    };
});

canvas.addEventListener("mousemove", function (e) {
    if (startPoint) {
        scrollOffset.x = startPoint.x - e.pageX;
        scrollOffset.y = startPoint.y - e.pageY;

        //scrollOffset.x = Math.max(scrollOffset.x, 0);
        //scrollOffset.x = Math.min(scrollOffset.x, map.width - window.innerWidth);

        //scrollOffset.y = Math.max(scrollOffset.y, 0);
        //scrollOffset.y = Math.min(scrollOffset.y, map.height - window.innerHeight);
    }
});

canvas.addEventListener("mouseup", function () {
    mapOffset.x += scrollOffset.x;
    mapOffset.y += scrollOffset.y;
    scrollOffset.x = 0;
    scrollOffset.y = 0;
    startPoint = false;
});

var canvasWidth = canvas.width;
var canvasHeight = canvas.height;

var framesDuration = [];
var lastFrame = 0;

var initial = true;

var pushFrameTime = function(){
    now = new Date();
    framesDuration.push(now-lastFrame);
    lastFrame = now;
};

var getAvgFrameTime = function(){
    var total = 0;
    for(var i = 0 ; i < framesDuration.length ; i++){
        total += framesDuration[i];
    }
    var out = Math.round(total*100/framesDuration.length)/100;
    framesDuration = [];
    return out;
};

var render = function () {
    pushFrameTime();
    setTimeout(render, frameEach);

    var scrollToX = mapOffset.x + scrollOffset.x;
    var scrollToY = mapOffset.y + scrollOffset.y;

    var startXIndex = Math.floor(scrollToX / tileWidth);
    var startYIndex = Math.floor(scrollToY / tileHeight);

    var endXIndex = Math.floor((scrollToX + canvasWidth) / tileWidth);
    var endYIndex = Math.floor((scrollToY + canvasHeight) / tileHeight);

    var incX = 0;
    var incY = 0;

    //ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    var shift = {
        x: lastShift.x - scrollToX,
        y: lastShift.y - scrollToY
    };
    
    var hasShift = shift.x !== 0 || shift.y !== 0;
    
    if(hasShift){
        ctx.drawImage(canvas, shift.x, shift.y);
        if(shift.x < 0){
            startXIndex += Math.floor(shift.x/tileWidth);
            startXIndex = Math.max(0,startXIndex);
        } else {
            endXIndex -= Math.ceil(shift.x/tileWidth);
            endXIndex = Math.min(endXIndex,xTileCount-1);
        }
        
        if(shift.y < 0){
            startYIndex += Math.floor(shift.y/tileHeight);
            startYIndex = Math.max(0,startYIndex);
        } else {
            endYIndex -= Math.ceil(shift.y/tileHeight);
            endYIndex = Math.min(endYIndex,yTileCount-1);
        }
    }
    
    if (hasShift || initial) {
        initial = false;
        var sx, sy, sw, sh, dx, dy;

        for (var x = startXIndex; x <= endXIndex; x++) {
            for (var y = startYIndex; y <= endYIndex; y++) {
                sx = 0;
                sy = 0;
                dx = incX;
                dy = incY;

                if (incX + tileWidth < canvas.width) {
                    sw = tileWidth;
                } else {
                    sw = canvasWidth - incX;
                }

                if (incY + tileHeight < canvas.height) {
                    sh = tileHeight;
                } else {
                    sh = canvasHeight - incY;
                }

                if (startXIndex === x) {
                    sx = scrollToX - x * tileWidth;
                    dx = 0;
                    sw = tileWidth - sx;
                }

                if (startYIndex === y) {
                    sy = scrollToY - y * tileHeight;
                    dy = 0;
                    sh = tileHeight - sy;
                }

                ctx.drawImage(tiles[x + "-" + y], sx, sy, sw, sh, dx, dy, sw, sh);
                incY += sh;
            }
            incX += sw;
            incY = 0;
        }
    }

    lastShift = {
        x: scrollToX,
        y: scrollToY
    };
};