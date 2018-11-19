function clone(arr1, arr2){
    //arr1 = source, arr2 = dest
    //quicker (for me) than using the polyfill for Array.from and forEach
    for (var i=0; i<arr1.length; ++i){
        arr2.push(arr1[i]);
    }
    return arr2;
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
	//take in a (sorted) array of vertices, and return 6 groups of co-planar vertices, two for each dimension
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

/*function translate(verts, axes, amount){
    //x = 1, y = 2, z = 4
    var res = [];
    for (var i = 0; i < verts.length; ++i){
        var tmp = [];
        if (axes & 1){
            tmp.push(verts[i][0]+amount*1.02);
        }
        else tmp.push(verts[i][0]);
        if (axes & 2){
            tmp.push(verts[i][1]+ amount*1.02);
        }
        else tmp.push(verts[i][1]);
        if (axes & 4){
            tmp.push(verts[i][2] + amount*1.02);
        }
        else tmp.push(verts[i][2]);
        res.push(tmp);
    }
    return res;
}
*/

function rotMat3(mat){
	var tmp = [];
	tmp.push([ mat[2][0], mat[1][0], mat[0][0] ]);
	tmp.push([ mat[2][1], mat[1][1], mat[0][1] ]);
	tmp.push([ mat[2][2], mat[1][2], mat[0][2] ]);
	return tmp;
}

function find_t(v1, v2){
	if (v1[0] == v2[0]){
		return [v1[0], 0, 0];
	}
	if (v1[1] == v2[1]){
		return [0, v1[1], 0];
	}
	if (v1[2] == v2[2]){
		return [0, 0, v1[2]];
	}
	throw "No common axis!";
}

function divide(v1, v2){
	var result = [];
	for (var i = 0; i < v1.length; ++i){
		if (v2[i] == 0){
			result.push(0);
		}
		else{
			result.push(v1[i] / v2[i]);
		}
	}
	return result;
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
