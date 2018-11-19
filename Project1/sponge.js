"use strict";

var canvas;
var gl;

var points = [];
var colors = [];

var NumTimesToSubdivide = 3;

var theta = [-10, 225, 0];
var thetaLoc;

var vertices = [vec3( -0.5, -0.5, -0.5),
				vec3( -0.5, -0.5, 0.5),
				vec3( -0.5, 0.5, -0.5),
                vec3( -0.5, 0.5, 0.5),
				vec3( 0.5, -0.5, -0.5),
				vec3( 0.5, -0.5, 0.5),
				vec3( 0.5, 0.5, -0.5),
                vec3( 0.5, 0.5, 0.5)];

var rotating = false;
var cursorStart;

function clone(arr1, arr2){
    //arr1 = source, arr2 = dest
    //quicker (for me) than using the polyfill for Array.from and forEach
    for (var i=0; i<arr1.length; ++i){
        arr2.push(arr1[i]);
    }
}

function retpush(arr1, item){
    arr1.push(item);
    return arr1;
}

function cubes_equal(cube1, cube2){
	if (cube1.length != cube2.length){
		return false;
	}
	for (var i = 0; i < cube1.length; ++i){
		if (cube1[i].length != cube2[i].length) {return false;}
		for (var j = 0; j < cube1[i].length; ++j){
			if (Math.round(cube1[i][j]*100000)/100000 != Math.round(cube2[i][j]*100000)/100000){
				return false;
			}
		}
	}
	return true;
}

function v3compare(a, b){
    //trivial case
    if (a == b){
        return 0;
    }
    //first, enforce this order: ---, --+, -+-, -++, +--, +-+, ++-, +++
    /*var sign_a = (a[0] > 0 ? 4 : 0)|(a[1] > 0 ? 2 : 0)|(a[2] > 0 ? 1 : 0);
    var sign_b = (b[0] > 0 ? 4 : 0)|(b[1] > 0 ? 2 : 0)|(b[2] > 0 ? 1 : 0);
    if (sign_a != sign_b){
        return sign_a - sign_b;
    }*/
    //make sure numbers that are /really/ close count as equal
    for (var i=0; i<a.length; ++i){
        a[i] = Math.round(a[i]*100000)/100000;
        b[i] = Math.round(b[i]*100000)/100000;
    }
	/*
    var xdiff = a[0]-b[0];
    if (xdiff != 0){ return xdiff;}
    var ydiff = a[1]-b[1];
    if (ydiff != 0){ return ydiff;}
    var zdiff = a[2]-b[2];
    if (zdiff != 0){ return zdiff;}
    return 0;
	*/
	
	var diff_a = ((a[0] > b[0]) ? 4 : 0)|((a[1] > b[1]) ? 2 : 0)|((a[2] > b[2]) ? 1 : 0);
	var diff_b = ((a[0] < b[0]) ? 4 : 0)|((a[1] < b[1]) ? 2 : 0)|((a[2] < b[2]) ? 1 : 0);
	//console.log(a, b, diff_a, diff_b);
	return diff_a - diff_b;
}

function group_planes(arr){
	//take in a (sorted) array of vertices, and return 8 groups of co-planar vertices, two for each dimension
	var x1 = [ arr[0] ];
	var x2 = [];
	var y1 = [ arr[0] ];
	var y2 = [];
	var z1 = [ arr[0] ];
	var z2 = [];
	for (var i = 1; i < arr.length; ++i){
		if (arr[i][0] == arr[0][0]){
			x1.push(arr[i]);
		}
		else { x2.push(arr[i]); }
		
		if (arr[i][1] == arr[0][1]){
			y1.push(arr[i]);
		}
		else { y2.push(arr[i]); }
		
		if (arr[i][2] == arr[0][2]){
			z1.push(arr[i]);
		}
		else { z2.push(arr[i]); }
	}
	return [ x1, y1, z1, x2, y2, z2 ];
}

function translate(verts, axes, amount){
    //x = 1, y = 2, z = 4
    var res = [];
    for (var i = 0; i < verts.length; ++i){
        var tmp = [];
        if (axes & 1){
            tmp.push(verts[i][0]+amount);
        }
        else tmp.push(verts[i][0]);
        if (axes & 2){
            tmp.push(verts[i][1]+ amount);
        }
        else tmp.push(verts[i][1]);
        if (axes & 4){
            tmp.push(verts[i][2] + amount);
        }
        else tmp.push(verts[i][2]);
        res.push(tmp);
    }
    return res;
}


function test_v3compare(){
	//test the initial cube, which has vectors with differently signed components
	//but equal absolute values
	var sorted_testcube0 = [];
	console.log("Test 0 - all vectors equal absolute value; different sign");
	clone(vertices, sorted_testcube0);
	sorted_testcube0.sort(v3compare);
	console.log(vertices);
	console.log(sorted_testcube0);
	console.log(cubes_equal(vertices, sorted_testcube0));
	
	
	var testcube1 = [vec3(-0.5, 0.16667, 0.16667),
					 vec3(-0.5, 0.16667, 0.5),
					 vec3(-0.5, 0.5, 0.16667),
					 vec3(-0.5, 0.5, 0.5),
					 vec3(-0.16667, 0.16667, 0.16667),
					 vec3(-0.16667, 0.16667, 0.5),
					 vec3(-0.16667, 0.5, 0.16667),
					 vec3(-0.16667, 0.5, 0.5)];
	var sorted_testcube1 = [];
	clone(testcube1, sorted_testcube1);
	sorted_testcube1.sort(v3compare);
	console.log("Test 1 - all vectors equal sign");
	console.log(testcube1);
	console.log(sorted_testcube1);
	console.log(cubes_equal(testcube1, sorted_testcube1));
}


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Initialize our data for the Sierpinski Gasket
    //

    // First, initialize the vertices of our 3D gasket
    // Four vertices on unit circle
    // Intial tetrahedron with equal length sides

    var args = [];
    clone(vertices, args);
    args.push(NumTimesToSubdivide);
    divideCube.apply(this, args);
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

    // Create a buffer object, initialize it, and associate it with the
    //  associated attribute variable in our vertex shader

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    thetaLoc = gl.getUniformLocation(program, "theta");
	
	
	canvas.onmousedown = function(event){
		rotating = true;
		cursorStart = [event.clientX, event.clientY];
	}
	canvas.onmousemove = function(event){
		if (rotating != false){
			var cursorEnd = [event.clientX, event.clientY];
			theta[1] += (cursorEnd[0]-cursorStart[0]);
			theta[0] += (cursorEnd[1]-cursorStart[1]);
			requestAnimFrame(render);
			cursorStart = cursorEnd;
		}
	}
	
	canvas.onmouseup = function(event){
		rotating = false;
	}
	
	
	
    render();
};



function triangle( a, b, c, color )
{

    // add colors and vertices for one triangle
	
    var baseColors = [
		vec3(0.0, 0.5, 0.0),
		vec3(0.0, 0.0, 0.0),
		vec3(0.5, 0.0, 0.25),
		vec3(1.0, 0.0, 0.0),
		vec3(0.0, 0.0, 0.5),
		vec3(1.0, 0.5, 0.0)		
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

function cube( a, b, c, d, e, f, g, h)
{
    var cb = [a, b, c, d, e, f, g, h].sort(v3compare);
	cb = group_planes(cb);
	for (var i=0; i<cb.length; ++i){
		square.apply(this, retpush(cb[i], i));
	}
}

function divideCube( a, b, c, d, e, f, g, h, count)
{
    if ( count === 0 ) {
        cube( a, b, c, d, e, f, g, h);
    }
    else {
        //first cube with corner at vertex a:
        //a, ab, abdc, ad, ae, aebf, aedh, aedhbcfg
        var cb = [a, b, c, d, e, f, g, h].sort(v3compare);
        a = cb[3]; b = cb[2]; c = cb[6]; d = cb[7];
        e = cb[1]; f = cb[0]; g = cb[4]; h = cb[5];
        var ab = mix(a, b, 1/3);
        var dc = mix(d, c, 1/3);
        var abdc = mix(ab, dc, 1/3);
        var ad = mix(a, d, 1/3);
        var ae = mix(a, e, 1/3);
        var bf = mix(b, f, 1/3);
        var aebf = mix(ae, bf, 1/3);
        var dh = mix(d, h, 1/3);
        var aedh = mix(ae, dh, 1/3);
        var bc = mix(b, c, 1/3);
        var fg = mix(f, g, 1/3);
        var bcfg = mix(bc, fg, 1/3);
        var aedhbcfg = mix(aedh, bcfg, 1/3);

        --count;
        var tlen = ad[0]-a[0];
        //now, all the cubes
        var cube1 = [a, ab, abdc, ad, ae, aebf, aedh, aedhbcfg];
        var cube2 = translate(cube1, 1, ad[0]-a[0]);
        var cube3 = translate(cube2, 1, ad[0]-a[0]);
        var cube4 = translate(cube1, 4, ab[2]-a[2]);
        var cube5 = translate(cube4, 4, ab[2]-a[2]);
        var cube6 = translate(cube5, 1, ad[0]-a[0]);
        var cube7 = translate(cube6, 1, ad[0]-a[0]);
        var cube8 = translate(cube3, 4, ab[2]-a[2]);


        var cube1r = translate(cube1, 2, (ae[1]-a[1])*2);
        var cube2r = translate(cube2, 2, (ae[1]-a[1])*2);
        var cube3r = translate(cube3, 2, (ae[1]-a[1])*2);
        var cube4r = translate(cube4, 2, (ae[1]-a[1])*2);
        var cube5r = translate(cube5, 2, (ae[1]-a[1])*2);
        var cube6r = translate(cube6, 2, (ae[1]-a[1])*2);
        var cube7r = translate(cube7, 2, (ae[1]-a[1])*2);
        var cube8r = translate(cube8, 2, (ae[1]-a[1])*2);
        
        var cube1m = translate(cube1, 2, ae[1]-a[1]);
        var cube2m = translate(cube3, 2, ae[1]-a[1]);
        var cube3m = translate(cube5, 2, ae[1]-a[1]);
        var cube4m = translate(cube7, 2, ae[1]-a[1]);

        divideCube.apply(this, retpush(cube1, count));
        divideCube.apply(this, retpush(cube2, count));
        divideCube.apply(this, retpush(cube3, count));
        divideCube.apply(this, retpush(cube4, count));
        divideCube.apply(this, retpush(cube5, count));
        divideCube.apply(this, retpush(cube6, count));
        divideCube.apply(this, retpush(cube7, count));
        divideCube.apply(this, retpush(cube8, count));

        divideCube.apply(this, retpush(cube1r, count));
        divideCube.apply(this, retpush(cube2r, count));
        divideCube.apply(this, retpush(cube3r, count));
        divideCube.apply(this, retpush(cube4r, count));
        divideCube.apply(this, retpush(cube5r, count));
        divideCube.apply(this, retpush(cube6r, count));
        divideCube.apply(this, retpush(cube7r, count));
        divideCube.apply(this, retpush(cube8r, count));

        divideCube.apply(this, retpush(cube1m, count));
        divideCube.apply(this, retpush(cube2m, count));
        divideCube.apply(this, retpush(cube3m, count));
        divideCube.apply(this, retpush(cube4m, count));

        }
}
function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform3fv(thetaLoc, theta);
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}
