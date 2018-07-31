var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
var objects = [];

//shortcut for drawing rectangles
function Rect(x, y, w, h, color, strokeColor, strokeWidth) {
  //sets this specific rectangle to parameter properties
  this.type = "rectangle";
  this.x = x || 250;
  this.y = y || 250;
  this.width = w || 50;
  this.height = h || 50;
  this.color = color || "rgba(0, 0, 0, 1)";
  this.strokeColor = strokeColor || "rgba(0, 0, 0, 0)";
  this.strokeWidth = strokeWidth || 0;
  this.rotation = 0;
  //add to objects to be drawn
  objects.push(this);
  //adds rect to canvas
  this.add = function() {
    //translate and rotate the drawing context
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.translate(-this.x - this.width / 2, -this.y - this.height / 2);
    //draw the filled rectangle
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    //draw the strokes
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }
  //moves gameobject certain amount
  this.move = function (speedX, speedY) {
    this.x += speedX || 0;
    this.y += speedY || 0;
    this.add();
  }
  //gets user input degrees, rotates the drawing context to certain degrees, moves it to the center point of object, and draws
  this.rotate = function (degrees) {
    this.rotation += degrees || 0;
    this.add();
  }
  //scales gameobject, giving it a new width and height. shortcut for making it new, or can directly modify width and height
  this.scale = function (newWidth, newHeight) {
    this.width = newWidth || this.width;
    this.height = newHeight || this.height;
    this.add();
  }
}

//shortcut for drawing circles
function Circle(x, y, r, color, strokeColor, strokeWidth) {
  //sets this specific circle to parametic properties
  this.type = "circle";
  this.x = x || 250;
  this.y = y || 250;
  this.radius = r || 25;
  this.width = this.radius;
  this.height = this.radius;
  this.color = color || "rgba(0, 0, 0, 1)";
  this.strokeColor = strokeColor || "rgba(0, 0, 0, 0)";
  this.strokeWidth = strokeWidth || 1;
  this.rotation = 0;
  //draws circle onto canvas
  this.add = function() {
    //circles are paths. there is no default js function for circles
    ctx.beginPath();
    //sets fill color and stroke color, as well as the stroke width
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    //draws the circle, and colors it
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }
  //moves gameobject certain amount
  this.move = function (speedX, speedY) {
    this.x += speedX || 0;
    this.y += speedY || 0;
  }
  //rotation is not needed, but this is just to allow room for tolerance
  this.rotate = function() {this.add();}
  //scales gameobject, giving it a new width and height. user can also change width and height directly
  this.scale = function (newRadius) {
    this.radius = newRadius || this.radius;
    this.add();
  }
}

//shortcut for drawing polygons of any type
function Polygon(points, color, strokeColor, strokeWidth) {
  //sets properties
  this.type = "polygon";
  this.points = points || null; //array of the coordinates of corners of the polygon
  this.color = color || "rgba(0, 0, 0, 1)";
  this.strokeColor = strokeColor || color;
  this.strokeWidth = strokeWidth || 0;
  this.rotation = 0;
  this.scale = 1;
  this.centerX; this.centerY;
  this.width; this.height;
  //adds object to canvas
  this.add = function() {
    this.setCenterPoint();
    //translate and rotate the drawing context
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(this.rotation);
    ctx.translate(-this.centerX, -this.centerY);
    //set the color properties
    ctx.lineWidth = this.strokeWidth;
    ctx.strokeStyle = this.strokeColor;
    ctx.fillStyle = this.color;
    //begin the drawing context and move to the first point
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    //move the drawing context to each point, and draw a line for each side
    for (var i = 0; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.closePath();
    //color it up
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  this.move = function(speedX, speedY) {
    for (var i = 0; i < this.points.length; i++) {
      this.points[i].x += speedX || 0;
      this.points[i].y += speedY || 0;
    }
    this.add();
  }
  //gets user input degrees, rotates the drawing context to certain degrees, moves it to the center point of object, and draws
  this.rotate = function (degrees) {
    this.rotation += (degrees * Math.PI / 180) || 0;
    this.add();
  }
  //private function that sets up width, height, and finds center
  this.setCenterPoint = function() {
    //finds the lowest and highest x value in points
    var minX = this.points[0].x;
    var maxX = this.points[1].x;
    var minY = this.points[0].y;
    var maxY = this.points[1].y;

    for (var i = 0; i < this.points.length; i++) {
      if (this.points[i].x < minX) {
        minX = this.points[i].x;
      }
      if (this.points[i].x > maxX) {
        maxX = this.points[i].x;
      }
      if (this.points[i].y < minY) {
        minY = this.points[i].y;
      }
      if (this.points[i].y > maxY) {
        maxY = this.points[i].y;
      }
    }
    //now we know min max XY, we can set the width, height, along with finding center
    this.width = maxX - minX;
    this.height = maxY - minY;
    this.centerX = minX + this.width / 2;
    this.centerY = minY + this.height / 2;
  }
}

//shortcut for adding text to canvas
function Text(text, x, y, fontStyle, fontSize, color) {
  this.type = "text";
  this.text = text || "New Text";
  this.x = x || 250;
  this.y = y || 250;
  this.fontStyle = fontStyle || "Arial";
  this.fontSize = fontSize || 30;
  this.color = color || "rgba(0, 0, 0, 1)";
  this.width = ctx.measureText(this.text).width;
  this.height = this.fontSize;
  this.rotation = 0;
  this.add = function () {
    this.width = ctx.measureText(this.text).width;
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.translate(-this.x - this.width / 2, -this.y - this.height / 2);
    //draw the image
    ctx.fillStyle = this.color;
    ctx.font = this.fontSize + "px "+ this.fontStyle;
    ctx.fillText(this.text, this.x - this.width / 2, this.y + this.height / 2);
    ctx.restore();
  }
  this.move = function (speedX, speedY) {
    this.x += speedX || 0;
    this.y += speedY || 0;
    this.add();
  }
  this.rotate = function(degrees) {
    this.rotation += degrees || 0;
    this.add();
  }
}

//shortcut for adding images. js already has class for image; this shortcuts it further
function ImagePic(src, x, y, width, height) {
  this.type = "image";
  this.image = new Image();
  this.image.src = src || "https://cdn.browshot.com/static/images/not-found.png";
  this.x = x || 250;
  this.y = y || 250;
  this.width = width || this.image.width || 400;
  this.height = height || this.image.height || 400;
  this.rotation = 0;
  this.add = function() {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.translate(-this.x - this.width / 2, -this.y - this.height / 2)
    //draw the image
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    ctx.restore();
  }
  this.resize = function(newWidth, newHeight) {
    this.width = newWidth || 0;
    this.height = newHeight || 0;
    this.add();
  }
  this.move = function(speedX, speedY) {
    this.x += speedX || 0;
    this.y += speedY || 0;
    this.add();
  }
  this.rotate = function(degrees) {
    this.rotation += degrees || 0;
    this.add();
  }
}

//checks for collisions between two objects in a box fashion
function checkCollisions(object1, object2) {
  if (
    (object1.x <= object2.x + (object2.width || object2.radius)) &&
    (object1.x + (object1.width || object1.radius) >= object2.x) &&
    (object1.y <= object2.y + (object2.height || object2.height)) &&
    (object1.y + (object1.height || object1.radius) >= object2.y)
  ) {
    return true;
  } else {
    return false;
  }
}

//refreshes canvas by painting it again and drawing all objects
function updateCanvas() {
  ctx.fillStyle = window.getComputedStyle(canvas).getPropertyValue("background-color");
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (i in objects) {
    objects[i].add();
  }
}

//entire class for input commands
var Input = {
  //keyboard input
  key : {
    //keeps track of key events, for faster response time
    //order of events: keydown (presses a key), keypress (holds a key), keyup (releases key)
    keyStates : {},
    //sets document up to recognize input
    initialize : function() {
      document.onkeydown = function(e) {
        //key is keydown the very first time it is being pressed. after 15ms, it will be set to keypress
        if (Input.key.keyStates[e.keyCode] != "keypress") {
          Input.key.keyStates[e.keyCode] = "keydown";
          setTimeout(function() {Input.key.keyStates[e.keyCode] = "keypress"}, 15);
        }
      }
      //when released
      document.onkeyup = function(e) {
        Input.key.keyStates[e.keyCode] = "keyup";
      }
    },
    getKeyDown : function(input) {
      return (this.keyStates[input] == "keydown") ? true : false;
    },
    getKeyPressed : function(input) {
      return (this.keyStates[input] == "keypress") ? true : false;
    },
    getKeyUp : function(input) {
      return (this.keyStates[input] == "keyup") ? true : false;
    }
  },

  //mouse input
  mouse : {
    mouseStates : {moving: false},
    mousePosition : {x: 0, y: 0},
    initialize : function() {
      canvas.onmousedown = function(e) {
        Input.mouse.mouseStates[e.button] = "down";
      }
      canvas.onmouseup = function(e) {
        Input.mouse.mouseStates[e.button] = "up";
      }
      canvas.onclick = function(e) {
        Input.mouse.mouseStates[e.button] = "clicked";
      }
      canvas.ondblclick = function(e) {
        Input.mouse.mouseStates[e.button] = "dblclicked";
      }
      canvas.onmousemove = function(e) {
        Input.mouse.mousePosition.x = e.clientX;
        Input.mouse.mousePosition.y = e.clientY;
        Input.mouse.mouseStates.moving = true;
        setTimeout(function() {Input.mouse.mouseStates.moving = false}, 100);
      }
    },
    onMouseDown : function(input) {
      return (this.mouseStates[input] == "down") ? true : false;
    },
    onMouseUp : function(input) {
      return (this.mouseStates[input] == "up") ? true : false;
    },
    onMouseClick : function(input) {
      if (this.mouseStates[input] == "clicked") {
        this.mouseStates[input] = undefined;
        return true;
      } else {
        return false;
      }
    },
    onMouseDblClick : function(input) {
      if (this.mouseStates[input] == "dblclicked") {
        this.mouseStates[input] = undefined;
        return true;
      } else {
        return false;
      }
    },
    onMouseMove : function() {
      return (this.mouseStates.moving) ? true : false;
    },
    onMouseDrag : function() {
      return (this.mouseStates.moving && this.mouseStates[0] == "down") ? true : false;
    }
  }
};

//the start method that is called when body is loaded
function Start() {
  updateCanvas();
  //initialize input
  Input.key.initialize();
  Input.mouse.initialize();
  start();
  Update();
}

function Update() {
  updateCanvas();
  update();
  updateCanvas();
  requestAnimationFrame(Update);
}

/*
  all user created code must have:

  function start() {}
  function update() {}

*/
