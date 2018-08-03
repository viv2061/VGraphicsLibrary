var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
var canvasDefaultColor = window.getComputedStyle(canvas).getPropertyValue("background-color");
var vObjects = [];

function background(color) {
  ctx.fillStyle = color || canvasDefaultColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

//basic object that provides basic transfrom properties and methods
class vObject {
  constructor (x, y, width, height) {
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 0;
    this.height = height || 0;
    this.rotation = 0;
    vObjects.push(this);
  }

  //when need to draw, must change/move around canvas appropriately to show transforms
  configureCanvas () {
    ctx.save();
    //translate and rotate the drawing
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.translate(-this.x, -this.y);
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

//basic vObject that also hold some graphical properties
class GraphicObject extends vObject {
  constructor (x, y, width, height, color, strokeColor, strokeWidth) {
    super(x, y, width, height);
    this.color = color || "black";
    this.strokeColor = strokeColor || this.color;
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
class Rectangle extends GraphicObject {
  constructor (x, y, width, height, color, strokeColor, strokeWidth) {
    super (x, y, width, height, color, strokeColor, strokeWidth);
    this.add();
  }

  add() {
    super.setup();
    ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
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
    ctx.ellipse(this.x, this.y, this.width, this.height, 0, 0, Math.PI * 2);
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
class ImagePic extends vObject {
  constructor(src, x, y, width, height) {
    super(x, y, width, height);
    this.image = new Image();
    let thing = this;
    this.image.onload = function() {
      thing.width = width || this.width;
      thing.height = height || this.height;
      thing.add();
    }
    this.image.src = src;
  }

  add() {
    super.configureCanvas();
    ctx.drawImage(this.image, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
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
    this.width = ctx.measureText(this.text).width;
    this.height = this.fontSize;
    ctx.restore();
    this.add();
  }

  add() {
    super.configureCanvas();
    ctx.fillStyle = this.color;
    ctx.font = this.fontSize + "px " + this.fontStyle;
    ctx.fillText(this.text, this.x - this.width / 2, this.y);
    ctx.restore();
  }
}

function updateCanvas() {
  background();
  vObjects.forEach(function(vOb) {
    vOb.add();
  });
}