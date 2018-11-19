"use strict";

var canvas;
var gl;
var angle = 0.0;
var angleLoc;
var points = [];
var subdivisions = 8;

var vertices = [
        vec2( -0.5, -0.5 ),
        vec2(  0,  0.5 ),
        vec2(  0.5, -0.5 )
    ];

divideTriangle(vertices[0], vertices[1], vertices[2], subdivisions);
	
window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }


    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
	//gl.getExtension('OES_standard_derivatives');

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	angleLoc = gl.getUniformLocation(program, "angle");
	
	document.getElementById("rotate").oninput = function(event) {
		angle = event.target.value;
		render();
    };
	
	//For IE10
	//document.getElementById("rotate").onchange = function(event) {
	//	angle = event.target.value;
	//	render();
    //};
	document.getElementById("divide").oninput = function(event) {
		subdivisions = event.target.value;
		points = [];
		divideTriangle(vertices[0], vertices[1], vertices[2], subdivisions);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
		render();
    };
	
	//For IE10
	//document.getElementById("divide").onchange = function(event) {
	//	subdivisions = event.target.value;
	//	points = [];
	//	render();
    //};
    render();
};

function triangle( a, b, c )
{
    points.push( a, b, b, c, c, a );
}

function divideTriangle( a, b, c, count )
{

    // check for end of recursion

    if ( count == 0 ) {
        triangle( a, b, c );
    }
    else {

        //bisect the sides

        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var bc = mix( b, c, 0.5 );

        --count;

        // three new triangles

        divideTriangle( a, ab, ac, count );
        divideTriangle( c, ac, bc, count );
        divideTriangle( b, bc, ab, count );
		divideTriangle( ab, bc, ac, count );
    }
}

function tessellate(pointsArr, times)
{
	//run divideTriangle for each triangle in shape
}


function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );
	
	gl.uniform1f(angleLoc, angle)
    gl.drawArrays(gl.LINES, 0, points.length, 3);


}
