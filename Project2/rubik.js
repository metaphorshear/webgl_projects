"use strict";

var canvas;
var gl;

var points = [];
var colors = [];
var cubes = {};

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc;
var instanceMatrix;

var cubetheta = [0, 0, 0];
var color = new Uint8Array(4);;

var vertices = [

    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];

var rotating = false;
var cursorStart;


var rotation = {
	"btop" : false,
	"midy" : false,
	"bottom" : false,
	"left" : false,
	"midx" : false,
	"right" : false,
	"cube" : true };


var cubes = [];
    cubes.push( [-1.02, 1.02, 1.02] );   //0
    cubes.push( [0, 1.02, 1.02] );       //1
    cubes.push( [1.02, 1.02, 1.02] );    //2
    
    cubes.push( [-1.02, 0, 1.02] );      //3
    cubes.push( [0, 0, 1.02] );          //4
    cubes.push( [1.02, 0, -1.02] );      //5
    
    cubes.push( [-1.02, -1.02, 1.02] );  //6
    cubes.push( [0, -1.02, 1.02] );      //7
    cubes.push( [1.02, -1.02, 1.02] );   //8
    
    cubes.push( [-1.02, 1.02, 0] );      //9
    cubes.push( [0, 1.02, 0] );          //10  
    cubes.push( [1.02, 1.02, 0] );       //11
    
    cubes.push( [-1.02, 0, 0] );         //12
    cubes.push( [0, 0, 0] );             //13
    cubes.push( [1.02, 0, 0] );          //14
    
    cubes.push( [-1.02, -1.02, 0] );     //15
    cubes.push( [0, -1.02, 0] );         //16
    cubes.push( [1.02, -1.02, 0] );      //17 
    
    cubes.push( [-1.02, 1.02, -1.02] );  //18
    cubes.push( [0, 1.02, -1.02] );      //19
    cubes.push( [1.02, 1.02, -1.02] );   //20
    
    cubes.push( [-1.02, 0, -1.02] );     //21
    cubes.push( [0, 0, -1.02] );         //22
    cubes.push( [1.02, 0, 1.02] );       //23
    
    cubes.push( [-1.02, -1.02, -1.02] ); //24
    cubes.push( [0, -1.02, -1.02] );     //25  
    cubes.push( [1.02, -1.02, -1.02] );  //26
    
 
    
	var thetas = {};
	var oldthetas = {};
	for (var key in rotation){
		thetas[key] = [0, 0, 0];
		oldthetas[key] = [0, 0, 0];
	}
	var state = [
				[[0, 1, 2],  //front
				 [3, 4, 5],
				 [6, 7, 8]],
				 
				[[9, 10, 11],//midz
				 [12, 13, 14],
				 [15, 16, 17]],
				 
				[[18, 19, 20],//back
				 [21, 22, 23],
				 [24, 25, 26]]
				 ];
var btop, midy, bottom, front, midz, back, left, midx, right;


function set_faces(){
	 btop = [flatten([state[0][0], state[1][0], state[2][0]]), [0, 1, 0]];
	 midy = [flatten([state[0][1], state[1][1], state[2][1]]), [0, 1, 0]];
	 bottom = [flatten([state[0][2], state[1][2], state[2][2]]), [0, 1, 0]];
	
	 front = [flatten(state[0]), [0, 0, 1]];
	 midz = [flatten(state[1]), [0, 0, 1]];
	 back = [flatten(state[2]), [0, 0, 1]];
	
	 left = [ [state[0][0][0], state[0][1][0], state[0][2][0], state[1][0][0], state[1][1][0], state[1][2][0], state[2][0][0], state[2][1][0], state[2][2][0]], [1, 0, 0]];
	 midx = [ [state[0][0][1], state[0][1][1], state[0][2][1], state[1][0][1], state[1][1][1], state[1][2][1], state[2][0][1], state[2][1][1], state[2][2][1]], [1, 0, 0]];
	 right = [ [state[0][0][2], state[0][1][2], state[0][2][2], state[1][0][2], state[1][1][2], state[1][2][2], state[2][0][2], state[2][1][2], state[2][2][2]], [1, 0, 0]];
}

function return_set(){
	//assumes only one key set at a time; this should be invariant
	for (var key in rotation){
		if (rotation[key]){
			return key;
		}
	}
}

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.3, 0.3, 0.3, 1.0 );

    // enable hidden-surface removal

    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

	instanceMatrix = mat4(); 
    //modelViewMatrix = mat4();
	modelViewMatrix = scalem(0.3, 0.3, 0.3);
    projectionMatrix = ortho(-1, 1, -1, 1, -1, 1);
	gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix) );
	
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    // Create a buffer object, initialize it, and associate it with the
    //  associated attribute variable in our vertex shader

	cube(vertices);
	initCubes();
	set_faces();

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );


    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	canvas.onmousedown = function(event){
		rotating = true;
		cursorStart = [event.clientX, event.clientY];
	}
	canvas.onmousemove = function(event){
		if (rotating != false){
			var t;
			if (!rotation["cube"]){
				t = thetas[return_set()];
			}
			else {
				t = cubetheta;
			}
			var cursorEnd = [event.clientX, event.clientY];
			t[1] += (cursorEnd[0]-cursorStart[0]);
			t[0] += (cursorEnd[1]-cursorStart[1]);
			requestAnimFrame(render);
			cursorStart = cursorEnd;
		}
	}
	
	canvas.onmouseup = function(event){
		rotating = false;
		var degrees;
		if (! rotation["cube"]){
			//snap rotation to multiple of 90 degrees, re-render, update side arrays
			var theta = thetas[return_set()];
			if (rotation["btop"] || rotation["midy"] || rotation["bottom"]){
				degrees = Math.round(theta[1] / 90);
				theta[1] = degrees * 90;
			}
			else if (rotation["left"] || rotation["midx"] || rotation["right"]){
				degrees = Math.round(theta[0] / 90);
				theta[0] = degrees * 90;
			}
		}
		/*
		if (! rotation["cube"] ){
			degrees = degrees % 4;
			while (degrees < 0) {degrees += 4;}
			for (var i = 0; i < degrees; ++i){
				set_state();
			}
			render(); //twice, to get around graphics issue
		}
		*/
		render();
	}
		
    render();
};



function triangle( a, b, c, color )
{

    // add colors and vertices for one triangle
	
    var baseColors = [
		vec4(0.0, 0.5, 0.0, 1.0),
		vec4(0.0, 0.0, 0.0, 1.0),
		vec4(0.5, 0.0, 0.25, 1.0),
		vec4(1.0, 0.0, 0.0, 1.0),
		vec4(0.0, 0.0, 0.5, 1.0),
		vec4(1.0, 0.5, 0.0, 1.0),
		vec4(0.0, 0.0, 0.0, 0.0) //invisible
     ];
	 
    colors.push( baseColors[color] );
    points.push( a );
    colors.push( baseColors[color] );
    points.push( b );
    colors.push( baseColors[color] );
    points.push( c );
}

function square( a, b, c, d, color)
{
    var sq = [a, b, c, d].sort();
    triangle(sq[0], sq[1], sq[2], color);
    triangle(sq[1], sq[3], sq[2], color);
}

function cube( arr, color=-1)
{	
	var cb = [];
    clone(arr, cb);
    cb.sort(v3compare);
	cb = group_planes(cb);
	for (var i=0; i<cb.length; ++i){
		if (color == -1){
		square.apply(this, retpush(cb[i], i));
		}
		else { 
		square.apply(this, retpush(cb[i], color)); }
	}
}

function initCubes(){
	for (var i = 0; i < cubes.length; ++i){
		cubes[i].t = translate(cubes[i]);
		cubes[i].r = rotate(0, [1, 1, 1]);
	}
}

/*

function set_state(){
	//find which side is being rotated, and update state accordingly
	//lots of copy-paste here; should refactor later
	var rset = return_set();
	var tmp, tmp2;
	if (rset == "btop"){
		tmp = [ state[0][0] ];
		state[0][0] = [ state[2][0][0], state[1][0][0], state[0][0][0] ];
		tmp.push( state[1][0] );
		state[1][0] = [ state[2][0][1], state[1][0][1], tmp[0][1] ];
		tmp.push( state[2][0] );
		state[2][0] = [ state[2][0][2], tmp[1][2], tmp[0][2] ];
		
	}
	else if (rset == "midy"){
		tmp = [ state[0][1] ];
		state[0][1] = [ state[2][1][0], state[1][1][0], state[0][1][0] ];
		tmp.push( state[1][1] );
		state[1][1] = [ state[2][1][1], state[1][1][1], tmp[0][1] ];
		tmp.push( state[2][1] );
		state[2][1] = [ state[2][1][2], tmp[1][2], tmp[0][2] ];
	}
	else if (rset == "bottom"){
		tmp = [ state[0][2] ];
		state[0][2] = [ state[2][2][0], state[1][2][0], state[0][2][0] ];
		tmp.push( state[1][2] );
		state[1][2] = [ state[2][2][1], state[1][2][1], tmp[0][1] ];
		tmp.push( state[2][2] );
		state[2][2] = [ state[2][2][2], tmp[1][2], tmp[0][2] ];
	}
	else if (rset == "front"){
		state[0] = rotMat3(state[0]);
	}
	else if (rset == "midz"){
		state[1] = rotMat3(state[1]);
	}
	else if (rset == "back"){
		state[2] = rotMat3(state[2]);
	}
	else if (rotation["left"] || rotation["midx"] || rotation["right"]){
		if (rset == "left"){
			tmp = [];
			clone(state, tmp);
			for (var i = 0; i < 3; ++i){
				tmp[i].matrix = true;
				tmp[i] = transpose(tmp[i]);
			}
			tmp2 = [ tmp[0][0] ];
			tmp[0][0] = [ tmp[2][0][0], tmp[1][0][0], tmp[0][0][0] ];
			tmp2.push( tmp[1][0] );
			tmp[1][0] = [ tmp[2][0][1], tmp[1][0][1], tmp2[0][1] ];
			tmp2.push( tmp[2][0] );
			tmp[2][0] = [ tmp[2][0][2], tmp2[1][2], tmp2[0][2] ];
			for (var i = 0; i < 3; ++i){
				tmp[i] = transpose(tmp[i]);
			}
			state = tmp;
		}
		else if (rset == "midx"){
			tmp = [];
			clone(state, tmp);
			for (var i = 0; i < 3; ++i){
				tmp[i].matrix = true;
				tmp[i] = transpose(tmp[i]);
			}
			tmp2 = [ tmp[0][1] ];
			tmp[0][1] = [ tmp[2][1][0], tmp[1][1][0], tmp[0][1][0] ];
			tmp2.push( tmp[1][1] );
			tmp[1][1] = [ tmp[2][1][1], tmp[1][1][1], tmp2[0][1] ];
			tmp2.push( tmp[2][1] );
			tmp[2][1] = [ tmp[2][1][2], tmp2[1][2], tmp2[0][2] ];
			for (var i = 0; i < 3; ++i){
				tmp[i] = transpose(tmp[i]);
			}
			state = tmp;
		}
		else {
			tmp = [];
			clone(state, tmp);
			for (var i = 0; i < 3; ++i){
				tmp[i].matrix = true;
				tmp[i] = transpose(tmp[i]);
			}
			tmp2 = [ tmp[0][2] ];
			tmp[0][2] = [ tmp[2][2][0], tmp[1][2][0], tmp[0][2][0] ];
			tmp2.push( tmp[1][0] );
			tmp[1][2] = [ tmp[2][2][1], tmp[1][2][1], tmp2[0][1] ];
			tmp2.push( tmp[2][0] );
			tmp[2][2] = [ tmp[2][2][2], tmp2[1][2], tmp2[0][2] ];
			for (var i = 0; i < 3; ++i){
				tmp[i] = transpose(tmp[i]);
			}
			state = tmp;
		}
	}
	set_faces();
}
*/


function return_theta(axis){
	//assumes rotation around one axis at a time
	var theta = thetas[return_set()];
	if (axis[0] == 1){
		return theta[0];
	}
	if (axis[1] == 1){
		return theta[1];
	}
	if (axis[2] == 1){
		return theta[2];
	}
}

function render_rotation(side){
	
	var idx = 0;
	var tmp;
	var rot;
	for (var i = 0; i < cubes.length; ++i){
		if (side[0][idx] == i){
			++idx;
			continue;
		}
		tmp = cubes[i].t;
		tmp = mult(tmp, cubes[i].r);
		tmp = mult(modelViewMatrix, tmp);
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten( tmp ) );
		gl.drawArrays( gl.TRIANGLES, 0, points.length );
	}
	var axis = side[1];
	for (var i = 0; i < side[0].length; ++i){
		tmp = cubes[side[0][i]].t;
		tmp = mult(tmp, cubes[side[0][i]].r);
		rot = rotate(return_theta(axis), axis[0], axis[1], axis[2]);
		if (return_theta(axis) % 90 == 0 && oldthetas[return_set()] != thetas[return_set()]){
			cubes[side[0][i]].r = mult(rot, cubes[side[0][i]].r);
		}
		tmp = mult(rot, tmp);
		tmp = mult(modelViewMatrix, tmp);
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten( tmp ) );
		gl.drawArrays( gl.TRIANGLES, 0, points.length );
	}
	if (return_theta(axis) % 90 == 0 && oldthetas[return_set()] != thetas[return_set()]){
		oldthetas[return_set()] = thetas[return_set()];
	}
	
}

function setRotation(flag){
	for (var key in rotation){
		if (key == flag){
			rotation[key] = true;
		}
		else {
			rotation[key] = false;
		}
	}
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if ( ! rotation["cube"] ){
		for (var key in rotation){
			if (rotation[key]){
				render_rotation(eval(key));
				break; //make sure only one rotates at a time
			}
		}
	}
    else {
		modelViewMatrix = scalem(0.3, 0.3, 0.3);
		modelViewMatrix = mult(rotate(cubetheta[1], 0, 1, 0 ), modelViewMatrix);
		modelViewMatrix = mult(rotate(cubetheta[0], 1, 0, 0 ), modelViewMatrix);
		var tmp;
		for (var i = 0; i < cubes.length; ++i){
			tmp = mult(cubes[i].t, cubes[i].r);
			tmp = mult(modelViewMatrix, tmp);
			gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten( tmp ) );
			gl.drawArrays( gl.TRIANGLES, 0, points.length );
		}
	}
	
}
