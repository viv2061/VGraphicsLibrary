var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
var canvasDefaultColor = window.getComputedStyle(canvas).getPropertyValue("background-color");

function background(color) {
  ctx.fillStyle = color || canvasBackground;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

//basic canvas object that provides basic transfrom properties
class vObject {
  constructor (x, y, width, height) {
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 0;
    this.height = height || 0;
    this.rotation = 0;
  }

  //when need to draw, must change/move around canvas appropriately to show transforms
  configureCanvas () {
    ctx.save();
    //translate and rotate the drawing
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.translate(-this.x - this.width / 2, -this.y - this.height / 2);
  }

  //easy function to move around object (change x and y)
  move(aX, aY) {
    this.x += aX || 0;
    this.y += aY || 0;
  }

  //easily adds rotating feature
  rotate(degrees) {
    this.rotation += degrees || 0;
  }

  //scales object by amt amount
  scale (amt) {
    this.width *= amt;
    this.height *= amt;
  }
}

//extends the vObject by also adding graphical properties (such as color and a path)
//still nothing is drawn yet
class GraphicObject extends vObject {
  constructor (x, y, width, height, color, strokeColor, strokeWidth) {
    super(x, y, width, height);
    this.color = color || "black";
    this.strokeColor = strokeColor || "black";
    this.strokeWidth = strokeWidth || 0;
    this.pathObject = new Path2D();
  }

  setup() {
    super.configureCanvas();
    this.pathObject.fillStyle = this.color;
    this.pathObject.strokeStyle = this.strokeColor;
    this.pathObject.lineWidth = this.strokeWidth;
  }
}

//a type of graphic object
class Rectangle extends GraphicObject {
  constructor (x, y, width, height, color, strokeColor, strokeWidth) {
    super (x, y, width, height, color, strokeColor, strokeWidth);
  }

  add() {
    super.setup();
    //this.pathObject.rect();
  }
}

class Ellipse extends GraphicObject {
  constructor (x, y, width, height, color, strokeColor, strokeWidth) {
    super (x, y, width, height, color, strokeColor, strokeWidth);
  }
}

class Circle extends Ellipse {
  constructor (x, y, radius, color, strokeColor, strokeWidth) {
    super (x, y, radius, radius, color, strokeColor, strokeWidth);
  }
}
