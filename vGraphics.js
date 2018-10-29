var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
var canvasDefaultColor = window.getComputedStyle(canvas).getPropertyValue("background-color");

var vObjects = [];

//basic object that provides basic transfrom properties and methods
class vObject {
  constructor (px = 0, py = 0, pwidth, pheight) {
    let thisvo = this;
    //transform properties and functions
    this.transform = {
      position: {x: px, y: py},
      width: pwidth || 0,
      height: pheight || 0,
      rotation: 0,
      translate: function(aX, aY) {
        this.position.x += aX || 0;
        if (thisvo.collide(undefined, true)) {
          thisvo.physics.velocity.x *= -.7;
        }
        while (thisvo.collide(undefined, true)) {
          this.position.x -= Math.sign(aX);
        }
        this.position.y += aY || 0;
        if (thisvo.collide(undefined, true)) {
          thisvo.physics.velocity.y *= -.7;
        }
        while (thisvo.collide(undefined, true)) {
          this.position.y -= Math.sign(aY);
        }
      },
      rotate: function(degrees) {
        this.rotation += degrees || 0;
      },
      scale: function(amt) {
        this.width *= amt;
        this.height *= amt;
      }
    }
    //physics stuff, like simulating forces and velocity
    this.physics = {
      enabled: false,
      velocity: {x: 0, y: 0},
      mass: 1,
      gravity: 0.25,
      update: function() {
        thisvo.transform.translate(this.velocity.x, this.velocity.y);
        //updating gravity and velocity in the y direction
        if (thisvo.collideBottom() && Math.abs(this.velocity.y) < this.gravity) {
          this.velocity.y = 0;
        } else {
          this.velocity.y += this.gravity;
        }
      },
    }
    //collider properties
    this.collider = {
      type: "rectangle",
      enabled: true,
      colliderVisual: null,
      showCollider: function() {
        if (this.colliderVisual == null) {
          this.colliderVisual = new Rect(thisvo.transform.position.x, thisvo.transform.position.y, thisvo.transform.width, thisvo.transform.height, "rgba(0, 0, 0, 0)", "limegreen");
          this.colliderVisual.collider.enabled = false;
        }
        this.colliderVisual.transform.position = thisvo.transform.position;
      }
    },
    //push this object to be updated
    vObjects.push(this);
  }

  //when need to draw, must change/move around canvas appropriately to show transforms
  configureCanvas () {
    ctx.save();
    //translate and rotate the drawing
    ctx.translate(this.transform.position.x, this.transform.position.y);
    ctx.rotate(this.transform.rotation * Math.PI / 180);
    ctx.translate(-this.transform.position.x, -this.transform.position.y);
    ctx.beginPath();
  }

  //check collisions. can take parameter for specific object or no param if want to check if colliding in general
  //regular collisions stick out a little bit more than collisions used for physics
  collide (other, onlyPhysics = false) {
    if (other === undefined) {
      for (let i = 0; i < vObjects.length; i++) {
        if (this !== vObjects[i] && this.collide(vObjects[i], onlyPhysics)) {
          return true;
        }
      }
      return false;
    } else {
      if (
        //box collision
        this.collider.enabled && other.collider.enabled &&
        (this.transform.position.x + this.transform.width / 2 >= other.transform.position.x - other.transform.width / 2 + (onlyPhysics ? 1 : 0)) &&
        (this.transform.position.x - this.transform.width / 2 <= other.transform.position.x + other.transform.width / 2 - (onlyPhysics ? 1 : 0)) &&
        (this.transform.position.y + this.transform.height / 2 >= other.transform.position.y - other.transform.height / 2 + (onlyPhysics ? 1 : 0)) &&
        (this.transform.position.y - this.transform.height / 2 <= other.transform.position.y + other.transform.height / 2 - (onlyPhysics ? 1 : 0))
      ) {
        return true;
      } else {
        return false;
      }
    }
  }
  
  collideBottom(other) {
    if (other === undefined) {
      for (let i = 0; i < vObjects.length; i++) {
        if (this !== vObjects[i] && this.collideBottom(vObjects[i])) {
          return true;
        }
      }
      return false;
    } else {
      if (
        this.collider.enabled && other.collider.enabled &&
        this.collide(other) && this.transform.position.y < other.transform.position.y
      ) {
        return true;
      } else {
        return false;
      }
    }
  }
}

//basic vObject that also hold some graphical properties
class GraphicObject extends vObject {
  constructor (x, y, width, height, color, strokeColor, strokeWidth) {
    super(x, y, width, height);
    this.color = color || "black";
    this.strokeColor = strokeColor || "rgba(0, 0, 0, 0)";
    this.strokeWidth = strokeWidth || 0;
  }

  //quickly set up colors and stroke properties to draw
  setup() {
    super.configureCanvas();
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
  }
}

//rectangle
class Rect extends GraphicObject {
  constructor (x, y, width, height, color, strokeColor, strokeWidth) {
    super (x, y, width, height, color, strokeColor, strokeWidth);
    this.add();
  }

  add() {
    super.setup();
    ctx.fillRect(this.transform.position.x - this.transform.width / 2, this.transform.position.y - this.transform.height / 2, this.transform.width, this.transform.height);
    ctx.strokeRect(this.transform.position.x - this.transform.width / 2, this.transform.position.y - this.transform.height / 2, this.transform.width, this.transform.height);
    ctx.restore();
  }
}

//drawing ellipses of any kind
class Ellipse extends GraphicObject {
  constructor (x, y, width, height, color, strokeColor, strokeWidth) {
    super (x, y, width, height, color, strokeColor, strokeWidth);
    this.add();
  }
  
  add() {
    super.setup();
    ctx.beginPath();
    ctx.ellipse(this.transform.position.x, this.transform.position.y, this.transform.width / 2, this.transform.height / 2, 0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

//a circle is an ellipse that is equal in width and height. This allows easy creation
class Circle extends Ellipse {
  constructor (x, y, radius, color, strokeColor, strokeWidth) {
    super (x, y, radius, radius, color, strokeColor, strokeWidth);
    this.add();
  }
}

//adding images
class Sprite extends vObject {
  constructor(src, x, y, width, height) {
    super(x, y, width, height);
    this.image = new Image();
    let temp = this;
    this.image.onload = function() {
      temp.add();
    }
    this.image.src = src;
  }

  add() {
    super.configureCanvas();
    ctx.drawImage(this.image, this.transform.position.x - this.transform.width / 2, this.transform.position.y - this.transform.height / 2, this.transform.width, this.transform.height);
    ctx.restore();
  }
}

class Text extends vObject {
  constructor(text, x, y, fontStyle, fontSize, color) {
    super(x, y);
    this.text = text || "New Text";
    this.fontStyle = fontStyle || "Arial";
    this.fontSize = fontSize || 12;
    this.color = color || "black";
    ctx.font = this.fontSize + "px " + this.fontStyle;
    this.transform.width = ctx.measureText(this.text).width;
    this.transform.height = this.fontSize;
    ctx.restore();
    this.add();
  }

  add() {
    super.configureCanvas();
    ctx.fillStyle = this.color;
    ctx.font = this.fontSize + "px " + this.fontStyle;
    ctx.fillText(this.text, this.transform.position.x - this.transform.width / 2, this.transform.position.y);
    ctx.restore();
  }
}

//entire class for input commands
var Input = {
  //keyboard input
  key : {
    //keeps track of key events, for faster response time
    //order of events: keydown (presses a key), keypress (holds a key), keyup (releases key), nokey (key stays up)
    keyStates : {},
    //sets document up to recognize input
    initialize : function() {
      document.onkeydown = function(e) {
        //key is keydown the very first time it is being pressed. after 15ms, it will be set to keypress
        if (Input.key.keyStates[e.keyCode] != "keypress") {
          Input.key.keyStates[e.keyCode] = "keydown";
          setTimeout(function() { Input.key.keyStates[e.keyCode] = "keypress" }, 15);
        }
      }
      //key is keyup the first first time it is being released. after 15ms, it will be set to nokey
      document.onkeyup = function(e) {
        Input.key.keyStates[e.keyCode] = "keyup";
        setTimeout(function () { Input.key.keyStates[e.keyCode] = "nokey" }, 15);
      }
    },
    getKeyDown : function(input) {
      return (this.keyStates[input] == "keydown") ? true : false;
    },
    anyKeyDown : function() {
      
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
    position : {x: 0, y: 0},
    canvasBox : canvas.getBoundingClientRect(),
    initialize : function() {
      canvas.onmousedown = function(e) {
        Input.mouse.mouseStates[e.button] = "down";
      }
      canvas.onmouseup = function(e) {
        Input.mouse.mouseStates[e.button] = undefined;
      }
      canvas.onclick = function(e) {
        Input.mouse.mouseStates[e.button] = "clicked";
        setTimeout(function() {Input.mouse.mouseStates[e.button] = undefined}, 100);
      }
      canvas.ondblclick = function(e) {
        Input.mouse.mouseStates[e.button] = "dblclicked";
      }
      canvas.onmousemove = function(e) {
        Input.mouse.position.x = e.clientX - Input.mouse.canvasBox.x;
        Input.mouse.position.y = e.clientY - Input.mouse.canvasBox.y;
        Input.mouse.mouseStates.moving = true;
        setTimeout(function() {Input.mouse.mouseStates.moving = false}, 100);
      }
    },
    onMouseDown : function(input) {
      return (this.mouseStates[input] == "down") ? true : false;
    },
    onMouseUp : function(input) {
      return (this.mouseStates[input] == undefined) ? true : false;
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
Input.key.initialize();
Input.mouse.initialize();

function background(color) {
  ctx.beginPath();
  ctx.fillStyle = color || canvasDefaultColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

//updates objects visually
function updateObjects() {
  background();
  vObjects.forEach(function(vOb) {
    vOb.add();
  });
}