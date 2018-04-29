var cubeRotation = 0, numberOfSegments=200, numberOfStationaryObstacles=4, left=false, right=false, theta, isPause=false, isStop=false, frames=0, level=1;
var faceColors = [], stationaryPositions = [], allPositions = [], allIndexes = [], indices = [];
var firstTime = true;
const canvas = document.querySelector('#glcanvas');
var x = document.getElementById('popup');
var score = document.getElementById('score');
var l = document.getElementById('level');
x.innerHTML = "<div style=\"background-color: #989898; width: 500px; height:300px\"><p style='font-size:30px; padding-top: 120px; padding-left: 120px; color: yellow; font-family: \"Lucida Sans Unicode\", \"Lucida Grande\", sans-serif'>INFINITE RUNNER</p><button type=\"button\" style=\"margin-left:200px; font-size:20px; background-color: red\" onClick=\"main();\">PLAY!</button></div>";
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');


//
// Start here
//
function main() {
  

  // If we don't have a GL context, give up now

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }
  isPause = false;
  isStop = false;
  x.innerHTML = "";
  // Vertex shader program

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;

  // Fragment shader program

  const fsSource = `
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVevrtexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  };
  cubeRotation = 0, numberOfSegments=200, numberOfStationaryObstacles=4, numberOfMovingObstacles=4, left=false, right=false, isPause=false, isStop=false, frames=0, level=1;
  faceColors = [], stationaryPositions = [], allPositions = [], allIndexes = [], indices = [];
  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  buffers = initBuffers(gl);
  var then = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);    // Clear everything
    gl.enable(gl.DEPTH_TEST);     // Enable depth testing
    gl.depthFunc(gl.LEQUAL);       // Near things obscure far things
    const fieldOfView = 35 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 1000.0;
    const projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix,
         fieldOfView,
         aspect,
         zNear,
         zFar);
    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if(!isStop){
       drawScene(gl, programInfo, buffers, deltaTime, projectionMatrix); 
    }
      
    else
      return;

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function getColorsArray(gl) {
  var colors = [];
  for (var j = 0; j < faceColors.length; ++j) {
    const c = faceColors[j];

    // Repeat each color four times for the four vertices of the face
    colors = colors.concat(c, c, c, c);
  }
  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  return colorBuffer;
}

function drawStationaryObstacle(tileNo) {
  var offset = -2*tileNo - 1;
  const positions = [
      // Top face
    -0.25, -1.0,  0.25+offset,
    0.25, -1.0,  0.25+offset,
    0.25,  1.0,  0.25+offset,
    -0.25,  1.0,  0.25+offset,

    // Back face
    -0.25, -1.0, -0.25+offset,
    -0.25,  1.0, -0.25+offset,
    0.25,  1.0, -0.25+offset,
    0.25, -1.0, -0.25+offset,

    // Top face
    -0.25,  1.0, -0.25+offset,
    -0.25,  1.0,  0.25+offset,
    0.25,  1.0,  0.25+offset,
    0.25,  1.0, -0.25+offset,

    // Bottom face
    -0.25, -1.0, -0.25+offset,
    0.25, -1.0, -0.25+offset,
    0.25, -1.0,  0.25+offset,
    -0.25, -1.0,  0.25+offset,

    // Right face
    0.25, -1.0, -0.25+offset,
    0.25,  1.0, -0.25+offset,
    0.25,  1.0,  0.25+offset,
    0.25, -1.0,  0.25+offset,

    // Left face
    -0.25, -1.0, -0.25+offset,
    -0.25, -1.0,  0.25+offset,
    -0.25,  1.0,  0.25+offset,
    -0.25,  1.0, -0.25+offset,
   ];
   for (var i = 0; i < positions.length; i++) {
      positions[i] *= 2;
    }
   return positions;
}


function generateCylinder(offset) {
    const positions = [
      // Top face
     -1.0,  1.0, -1.0+offset,
     -1.0,  1.0,  1.0+offset,
      1.0,  1.0,  1.0+offset,
      1.0,  1.0, -1.0+offset,

      // Bottom face
     -1.0, -1.0, -1.0+offset,
      1.0, -1.0, -1.0+offset,
      1.0, -1.0,  1.0+offset,
     -1.0, -1.0,  1.0+offset,

      // Right faces
     -1.0,  1.0,  1.0+offset,
     -2.0,  0.4,  1.0+offset,
     -2.0,  0.4,  -1.0+offset,
     -1.0,  1.0,  -1.0+offset,

      -2.0,  0.4,  1.0+offset,
     -2.0,  -0.4,  1.0+offset,
     -2.0,  0.4,  -1.0+offset,
     -2.0,  -0.4, -1.0+offset,

     -1.0,  -1.0,  1.0+offset,
     -2.0,  -0.4,  1.0+offset,
     -2.0,  -0.4,  -1.0+offset,
     -1.0,  -1.0,  -1.0+offset,

     1.0,  1.0,  1.0+offset,
     2.0,  0.4,  1.0+offset,
     2.0,  0.4,  -1.0+offset,
     1.0,  1.0,  -1.0+offset,

     2.0,  0.4,  1.0+offset,
     2.0,  -0.4,  1.0+offset,
     2.0,  0.4,  -1.0+offset,
     2.0,  -0.4, -1.0+offset,

      1.0,  -1.0,  1.0+offset,
      2.0,  -0.4,  1.0+offset,
      2.0,  -0.4,  -1.0+offset,
      1.0,  -1.0,  -1.0+offset
    ];
    for (var i = 0; i < positions.length; i++) {
      positions[i] *= 2;
    }
    return positions;
}

function generateColor() {
    const faceColors = [
      [0.0,  0.0,  0.8,  1.0],    // Front face: white
      [0.0,  0.3,  0.0,  1.0],    // Back face: red
      [0.4,  0.0,  0.0,  1.0],    // Top face: green
      [0.7,  0.2,  0.9,  1.0],    // Bottom face: blue
      [0.6,  1.0,  1.0,  1.0],    // Right face: yellow
      [0.7,  0.7,  0.1,  1.0],    // Left face: purple
      [0.8,  0.0,  0.1,  1.0],
      [0.8,  0.5,  0.3,  1.0],
    ];
    return shuffle(faceColors);
}

function shiftColor(gl) {
   var removed = faceColors.splice(0,8);
   for (var i = 0; i < removed.length; i++)
     faceColors.splice((numberOfSegments-1)*8+i,0,removed[i]);
   colors = getColorsArray(gl);
   return colors;
}

function getIndices(offset) {
  const indices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     13, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
    24, 25, 26,     25, 26, 27,
    28, 29, 30,     28, 30, 31
  ];
  for (var i = 0; i < indices.length; i++) {
    indices[i]+=offset;
  }
  return indices;
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//
function initBuffers(gl) {

  // Create a buffer for the cube's vertex positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  var statBuffers = initStationaryObstacles([10, 30, 50, 70]);
  // Now create an array of positions for the cube.
  for (var i = 0; i < numberOfSegments; i++) {
    var clist = generateCylinder(-i*2);
    allPositions = allPositions.concat(clist);
  }
  allPositions = allPositions.concat(statBuffers.position);
  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(allPositions), gl.STATIC_DRAW);

  // Now set up the colors for the faces. We'll use solid colors
  // for each face.



  // Convert the array of colors into a table for all the vertices.
  for (var i = 0; i < numberOfSegments; i++) {
    var clist = generateColor();
    faceColors = faceColors.concat(clist);
  }
  faceColors = faceColors.concat(statBuffers.color);
  colorBuffer = getColorsArray(gl);

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  for (var i = 0; i < numberOfSegments; i++) {
    clist = getIndices(i*32);
    indices = indices.concat(clist);
  }
  var offs = indices[indices.length-1];
  for (var i=0; i<statBuffers.index.length; i++)
    indices = indices.concat(offs+statBuffers.index[i]);
  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);
  // debugger;
  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer
  };

}

function getStationaryColor() {
  var ColorsArray = [
    [1.0,  0.0,  0.0,  1.0],
    [0.0,  1.0,  0.0,  1.0],
    [0.0,  0.0,  1.0,  1.0],
    [1.0,  1.0,  0.0,  1.0],
    [1.0,  0.0,  1.0,  1.0]
  ];
  var color = ColorsArray[Math.floor(Math.random()*5)];
  var resColor = [];
  for (var i=0; i<6; i++)
    resColor.push(color);
  return resColor;
}

function checkCollision(gl) {
  var count = 2;
  for (var i = 2; i < stationaryPositions.length; i=i+72) {
      var rot = (cubeRotation/(2*(Math.PI)));
      // debugger;
      if(stationaryPositions[i]>-4){
        var removed = stationaryPositions.splice(i-2,72);
        numberOfStationaryObstacles--;
        var j = ((i-2)/72);
        count = j;
        faceColors.splice(numberOfSegments*8+(6*j),6);
        allPositions.splice(numberOfSegments*96+count*72,72);
        indices.splice(numberOfSegments*48+count*36,36);
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(allPositions), gl.STATIC_DRAW);
        
        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(faceColors), gl.STATIC_DRAW);

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);
        
        if(!((rot>(1/8) && rot<(3/8))||(rot>(5/8) && rot<(7/8)))){
          isPause = true;
        isStop = true;
        x.innerHTML = "<div style=\"background-color: #989898; width: 500px; height:300px\"><p style='font-size:30px; padding-top: 120px; padding-left: 70px; color: yellow; font-family: \"Lucida Sans Unicode\", \"Lucida Grande\", sans-serif'>GAME OVER! YOU LOST :(</p><button type=\"button\" style=\"margin-left:200px; font-size:20px; background-color: red\" onClick=\"main();\">REPLAY</button></div>";
        }
        return {
          position: positionBuffer,
          color: colorBuffer,
          index: indexBuffer
        };
      }
  }
  return false;
}

function initStationaryObstacles(segments) {
  for (var i = 0; i < numberOfStationaryObstacles; i++) {
      var pos = drawStationaryObstacle(segments[i]);
      stationaryPositions = stationaryPositions.concat(pos);
  }

  // Now set up the colors for the faces. We'll use solid colors
  // for each face.

  var fceColors = [];
  for (var i = 0; i < numberOfStationaryObstacles; i++) {
      const f = getStationaryColor();
      fceColors = fceColors.concat(f);
  }
  var indices = [];
  for (var i = 0; i < numberOfStationaryObstacles; i++) {
    const index = [
      0,  1,  2,      0,  2,  3,    // front
      4,  5,  6,      4,  6,  7,    // back
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // bottom
      16, 17, 18,     16, 18, 19,   // right
      20, 21, 22,     20, 22, 23   // left
    ];
    indices = indices.concat(index);
  }

  return {
    position: stationaryPositions,
    color: fceColors,
    index: indices,
  };
}


function moveStationaryObstacles(gl) {
  for (var i = 0; i < stationaryPositions.length; i++) {
    if(i%3==2)
      stationaryPositions[i] += 1;
  }
  allPositions.splice(numberOfSegments*96,stationaryPositions.length);
  allPositions = allPositions.concat(stationaryPositions);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(allPositions), gl.STATIC_DRAW);

  return positionBuffer;
}


//
// Draw the scene.
//
function drawScene(gl, programInfo, buffers, deltaTime, projectionMatrix) {

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  score.innerHTML = "SCORE:" + frames.toString();
  l.innerHTML = "LEVEL:" + level.toString();
  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  if((frames%400)==0 && frames!=0)
    level++;
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  mat4.rotate(modelViewMatrix,  // destination matrix
  modelViewMatrix,  // matrix to rotate
  cubeRotation,     // amount to rotate in radians
  [0, 0, 1]); // axis to rotate around (Z)
  
  frames++;
  var factor = 1;
  switch (level) {
    case 1:
        factor = 10;
        break;
    case 2:
        factor = 5;
        break;
    case 3:
        factor = 3;
        break;
    default:
        factor = 1;
        break;
}
  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
      b = checkCollision(gl);  
    if(!isPause){
      if(frames%factor==0)
          buffers.position = moveStationaryObstacles(gl);
      if(b)
        buffers.position = b.position;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
   programInfo.attribLocations.vertexPosition,
   numComponents,
   type,
   normalize,
   stride,
   offset);
    gl.enableVertexAttribArray(
   programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the colors from the color buffer
  // into the vertexColor attribute.
  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    if(!isPause){
      if(frames%factor==0){
          buffers.color = shiftColor(gl);
      }
      if(b)
        buffers.color = b.color;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
   programInfo.attribLocations.vertexColor,
   numComponents,
   type,
   normalize,
   stride,
   offset);
    gl.enableVertexAttribArray(
   programInfo.attribLocations.vertexColor);
  }
  
  // var _normal = programInfo.attribLocations.normal;
  // gl.vertexAttribPointer(_normal, 3, gl.FLOAT, false,4*(3+3+2),3*4);
  // gl.enableVertexAttribArray(_normal);

  if(b&&!isPause)
    buffers.indices = b.index;
  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  {
    var vertexCount;
    vertexCount = 48*numberOfSegments + 36*numberOfStationaryObstacles;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

  // Update the rotation for the next draw

  // cubeRotation += deltaTime;
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

document.addEventListener('keydown', function(event) {
    if(event.keyCode == 37) {
        cubeRotation += (Math.PI/10);
    }
    else if(event.keyCode == 39) {
     cubeRotation -= (Math.PI/10);    
    }
    else if(event.keyCode == 32){
        if(isPause)
          isPause = false
        else
          isPause = true; 
    }
});
