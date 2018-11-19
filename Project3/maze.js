"use strict";

var canvas;
var gl;

var points = [];
var floor = [];
var walls = [];

var vertices = [

    vec4( 0, -1.0,  1, 1.0 ),
    vec4( 0,  1.0,  1, 1.0 ),
    vec4( 1,  1.0,  1, 1.0 ),
    vec4( 1, -1.0,  1, 1.0 ),
    vec4( 0, -1.0, 0, 1.0 ),
    vec4( 0,  1.0, 0, 1.0 ),
    vec4( 1,  1.0, 0, 1.0 ),
    vec4( 1, -1.0, 0, 1.0 )
];


var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc;
var instanceMatrix;


var lightPosition = vec4(0.0, 0.0, 2.0, 0.0 );
var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 0.3, 0.3, 0.3, 1.0 );
var materialDiffuse = vec4( 1.0, 0.5, 0.2, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 100.0;


var texture1, texture2;
var texCoordsArray = [];
var program;


var winPos;

/*var rotating = false;
var cursorStart;
*/
var theta = [0, 180, 0];

//may tweak texture coordinates later to get more variation
var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

//maze is hardcoded; Firefox would support e.g., var maze = File("maze"); not sure if Chrome supports this, and IE most likely doesn't
var maze = "11*11111 \
			11000011 \
			11011111 \
			11000001 \
			11111101 \
			11011101 \
			11011101 \
			11000001 \
			11110111 \
			11000001 \
			11111011 \
			11111011 \
			11.10001 \
			11010111 \
			11010111 \
			11000011 \
			11111011 \
			11000011 \
			11111111"

var pos;
var direction = 0;



function configureTexture( image ) {
    var texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB,
         gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
	return texture;
}


function quad(a, b, c, d, v, pointsArr=walls) {
     pointsArr.push(v[a]);
     texCoordsArray.push(texCoord[0]);
     pointsArr.push(v[b]);
     
     texCoordsArray.push(texCoord[1]);
     pointsArr.push(v[c]);
     
     texCoordsArray.push(texCoord[2]);
     pointsArr.push(v[a]);
     
     texCoordsArray.push(texCoord[0]);
     pointsArr.push(v[c]);
     
     texCoordsArray.push(texCoord[2]);
     pointsArr.push(v[d]);
     
     texCoordsArray.push(texCoord[3]);
}


//each wall will be a cube, to simplify the maze generation
function cube(v)
{
    quad( 3, 0, 4, 7, v );
    quad( 6, 5, 1, 2, v );
    quad( 4, 5, 6, 7, v );
    quad( 5, 4, 0, 1, v );
    quad( 2, 3, 7, 6, v );
    quad( 1, 0, 3, 2, v );
}

function readMaze(){
	maze = maze.split(' ');
	var match;
	var idx = 0;
	for (var i = 0; i < maze.length; ++i){
		maze[i] = maze[i].trim();
		match = maze[i].search(/\./);
		if (match != -1){
			pos = [idx+0.5, match+0.5];
		}
		++idx;
	}
}

function translateV(v, tVec){
	//v is a list of vertices, and tVec is a translation vector
	var tmp = [];
	for (var i = 0; i < v.length; ++i){
		tmp.push(vec4(v[i][0]+tVec[0], v[i][1]+tVec[1], v[i][2]+tVec[2], v[i][3]));
	}
	return tmp;
}


function buildMaze(){
	//instanceMatrix = scalem(3, 3, 3);
	var tmp;
	for (var i = 0; i < maze.length; ++i){
		for (var j = 0; j < maze[i].length; ++j){
			if (maze[i][j] > "0"){
				/*
				tmp = mult(translate((j-pos[1]), 0, (i-pos[0])), instanceMatrix);
				gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten( mult(modelViewMatrix, tmp) ) );
				gl.drawArrays( gl.TRIANGLES, 0, points.length );
				*/
				tmp = translateV(vertices, vec3(j, 0, i) );
				//tmp = translateV(vertices, vec3(j-pos[1], 0, i-pos[0]));
				cube(tmp);
			}
			else {
				tmp = translateV(vertices, vec3(j, 0, i) );
				quad( 3, 0, 4, 7, tmp, floor);
			}
		}
	}
	for (var i = 0; i < walls.length; ++i){
		points.push(walls[i]);
	}
	
	for (var i = 0; i < floor.length; ++i){
		points.push(floor[i]);
	}
}

function walk(distance){
	//collision detection idea from http://www.playfuljs.com/a-first-person-engine-in-265-lines/
	
	direction = theta[1] % 360;
	
	var dy = Math.cos( radians(direction) ) * distance;
	var dx = Math.sin( radians(direction) ) * distance;
		
	if (map_get(pos[1] + dx, pos[0]) <= "0") pos[1] += dx;
    if (map_get(pos[1], pos[0] + dy) <= "0") pos[0] += dy;
    
    modelViewMatrix = translate(-(pos[1]), 0, -(pos[0]));
    modelViewMatrix = mult( rotateY(direction), modelViewMatrix);
    render();
    
    if (map_get(pos[1], pos[0]) == "*"){
		alert("You win! Congratulations!");
	}
	
}


function map_get(x, y) {
    x = Math.floor(x*1.05);
    y = Math.floor(y*1.05);
    if (x < 0 || x > maze[0].length - 1 || y < 0 || y > maze.length - 1) return "0";
    return maze[y][x];
};



/*
function move(dir){
	pos = [ pos[0]+dirs[dir][0], pos[1]+dirs[dir][1] ];
	//then update the rendering
}

function canMove(dir){
	var newPos = [ pos[0]+dirs[dir][0], pos[1]+dirs[dir][1] ];
	if (newPos[0] < 0 || newPos[1] < 0 || maze[newPos[0]][newPos[1]] == "1"){
		return false;
	}
	return true;
}
*/

window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.08, 0.13, 0.2, 1.0 );

    // enable hidden-surface removal

    gl.enable(gl.DEPTH_TEST);
    
    //  Load shaders and initialize attribute buffers

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

	instanceMatrix = mat4(); 
	modelViewMatrix = mat4();
	
	
    readMaze();
	buildMaze();
    
    projectionMatrix = perspective(100, 0.5, 0.1, 10000);
    
    
	gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix) );
	
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    // Create a buffer object, initialize it, and associate it with the
    //  associated attribute variable in our vertex shader
   // cube();
   

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );


    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);
	
	
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );


    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

	
	var image1 = document.getElementById("texImage1");
	var image2 = document.getElementById("texImage2");
	
	
    texture1 = configureTexture( image1 );
    texture2 = configureTexture( image2 );
	
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture1);
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, texture2);
	
	
	gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);



    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);
	
	gl.uniform4fv( gl.getUniformLocation(program,
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program,
       "shininess"),materialShininess );
	
	window.onkeydown = function(event){
		//This should work in Firefox; must test in other browsers...
		event = event || window.event;
		var keyCode = event.keyCode;
		if (keyCode == 37){ //left
			theta[1] += 2;
			walk(0);
		}
		else if (keyCode == 39){ //right
			theta[1] -= 2;
			walk(0);
		}
		else if (keyCode == 38){ //up
			walk(-0.1);
		}
		else if (keyCode == 40){ //down
			walk(0.1);
		}
	}
    
	walk(0);
	
	
	
};


function render(){
	
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
	//var tmp = mult(rotate(theta[1], 0, 1, 0 ), modelViewMatrix);
	
	//modelViewMatrix = mult(rotate(theta[0]/1000, 1, 0, 0 ), modelViewMatrix);
	
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten( modelViewMatrix ) );
	
	gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
	gl.drawArrays( gl.TRIANGLES, 0, walls.length );
	
	gl.uniform1i(gl.getUniformLocation(program, "texture"), 1);
	gl.drawArrays( gl.TRIANGLES, walls.length, floor.length );
	
};
