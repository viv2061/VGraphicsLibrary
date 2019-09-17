// TODO: fix this up a little
let canvas = {
    intialize: function(width = 800, height = 800, color = "white") {
        this.canvas = document.querySelector("canvas");
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.ctx = this.canvas.getContext("2d");
        this.backgroundColor = window.getComputedStyle(this.canvas).getPropertyValue("background-color");
    },
    clear: function(color = this.backgroundColor) {
        this.ctx.beginPath();
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.closePath();
    }
};

canvas.intialize();

// An array keeping track of all vObjects that were made
let vObjects = [];

// A component is one part of an vObject, responsible for a certain task.
// Components should always be attached to an vObject
// Component is the parent class. All it does is attach the child classes to the vObject
class Component {
    constructor(thisvo) {
        this.thisvo = thisvo;
    }
}

// Transform is responsible for recording/updating position, rotation, and size
// All vObjects start with a Transform, since other components also rely on the Transform
class Transform extends Component {
    constructor (thisvo, x = 0, y = 0, width = 0, height = 0) {
        super (thisvo);
        this.position = new Vector2d(x, y);
        this._rotation = 0;
        this._width = width;
        this._height = height;
    }

    get rotation() {
        return this._rotation;
    }

    set rotation(degrees) {
        this._rotation = degrees;
        if (this.thisvo.collider != null) this.thisvo.collider.updateCollider();
    }

    translate(xAmt = 0, yAmt = 0) {
        this.position.x += xAmt;
        this.position.y += yAmt;
    }

    rotate(amt = 90) {
        this.rotation += amt;
    }

    get width() {
        return this._width;
    }

    set width(newWidth) {
        this._width = newWidth;
        if (this.thisvo.collider != null) this.thisvo.collider.updateCollider();
    }

    get height() {
        return this._height;
    }

    set height(newHeight) {
        this._height = newHeight;
        if (this.thisvo.collider != null) this.thisvo.collider.updateCollider();
    }
}

// Renderer setups the canvas and draws/renders the vObject it is attached to
// Two types can be attached: Graphic and Sprite
// It is possible to combine the two classes into one renderer class,
// but I decided to separate them since they have very different properties

// The parent class of all renderers. Adds common functionality for renderers
class Renderer extends Component {
    constructor (thisvo) {
        super (thisvo);
        this.enabled = true;
    }

    configureCanvas() {
        canvas.ctx.save();
        canvas.ctx.translate(this.thisvo.transform.position.x, this.thisvo.transform.position.y);
        canvas.ctx.rotate(this.thisvo.transform.rotation * Math.PI / 180);
        canvas.ctx.translate(-this.thisvo.transform.position.x, -this.thisvo.transform.position.y);
    }
}

// Graphic renderers render basic shapes and polygons
class GraphicRenderer extends Renderer {
    constructor (thisvo, color = "black", strokeColor = "rgba(0, 0, 0, 0)", strokeWidth = 0, isColliderViewer = false) {
        super(thisvo);
        this.color = color;
        this.stroke = {
            color: strokeColor,
            width: strokeWidth
        }
        this.isColliderViewer = isColliderViewer;
    }

    setup() {
        if (!this.isColliderViewer) {
            super.configureCanvas();
        } else {
            canvas.ctx.save();
        }
        canvas.ctx.fillStyle = this.color;
        canvas.ctx.strokeStyle = this.stroke.color;
        canvas.ctx.lineWidth = this.stroke.width;
    }
}

class RectRenderer extends GraphicRenderer {
    constructor(thisvo, color = "black", strokeColor = "rgba(0, 0, 0, 0)", strokeWidth = 0, isColliderViewer = false) {
        super (thisvo, color, strokeColor, strokeWidth, isColliderViewer);
        this.add();
    }

    add() {
        super.setup();
        canvas.ctx.fillRect(this.thisvo.transform.position.x - this.thisvo.transform.width / 2, this.thisvo.transform.position.y - this.thisvo.transform.height / 2, this.thisvo.transform.width, this.thisvo.transform.height);
        canvas.ctx.strokeRect(this.thisvo.transform.position.x - this.thisvo.transform.width / 2, this.thisvo.transform.position.y - this.thisvo.transform.height / 2, this.thisvo.transform.width, this.thisvo.transform.height);
        canvas.ctx.restore();
    }
}

class EllipseRenderer extends GraphicRenderer {
    constructor(thisvo, color = "black", strokeColor = "rgba(0, 0, 0, 0)", strokeWidth = 0, isColliderViewer = false) {
        super(thisvo, color, strokeColor, strokeWidth, isColliderViewer);
        this.add();
    }

    add() {
        super.setup();
        canvas.ctx.beginPath();
        canvas.ctx.ellipse(this.thisvo.transform.position.x, this.thisvo.transform.position.y, this.thisvo.transform.width / 2, this.thisvo.transform.height / 2, 0, 0, Math.PI * 2);
        canvas.ctx.closePath();
        canvas.ctx.fill();
        canvas.ctx.restore();
    }
}

class CircleRenderer extends GraphicRenderer {
    constructor(thisvo, color = "black", strokeColor = "rgba(0, 0, 0, 0)", strokeWidth = 0, isColliderViewer = false) {
        super(thisvo, color, strokeColor, strokeWidth, isColliderViewer);
        this.add();
    }

    add() {
        super.setup();
        canvas.ctx.arc(this.thisvo.transform.position.x, this.thisvo.transform.position.y, this.thisvo.transform.width, 0, 2 * Math.PI);
        canvas.ctx.fill();
        canvas.ctx.stroke();
        canvas.ctx.restore();
    }
}

class PolygonRenderer extends GraphicRenderer {
    constructor (thisvo, color = "black", strokeColor = "rgba(0, 0, 0, 0)", strokeWidth = 0, vertexes = [], isColliderViewer = false) {
        super (thisvo, color, strokeColor, strokeWidth, isColliderViewer);
        // NOTE: vertexes is an array that have points that indicate OFFSET FROM POSITION, NOT ITS TRUE POSITION
        // For example, if position is (100, 200) and one vertex is (-50, 20), then the true position of that vertex is (50, 220)
        // have to do this in order to deep clone array of vertexes
        this.vertexes = [];
        // these 3 variables will be used for scaling
        this.originalVertexes = [];
        this.originalSize = new Vector2d(this.thisvo.transform.width, this.thisvo.transform.height);
        this.currentScale = new Vector2d(1, 1);
        // have to do this to deep clone correctly
        vertexes.forEach(vertex => {
            this.vertexes.push(new Vector2d(vertex.x, vertex.y));
            this.originalVertexes.push(new Vector2d(vertex.x, vertex.y));
        });
        this.add();
    }

    add() {
        if (this.vertexes.length != 0) {
            super.setup();
            // figure out scaling if it is not a collider viewer
            // (Collider viewers/Renderers are independent of the actual vObject's transform/rotation - instead it relies directly on collider vertexes)
            // That is why we don't want to config/rotate the canvas
            if (!this.isColliderViewer) {
                this.currentScale = new Vector2d(this.thisvo.transform.width / this.originalSize.x, this.thisvo.transform.height / this.originalSize.y);
                for (let i = 0; i < this.vertexes.length; i++) {
                    this.vertexes[i].x = this.originalVertexes[i].x * this.currentScale.x;
                    this.vertexes[i].y = this.originalVertexes[i].y * this.currentScale.y;
                }
            }
            // draw all vertexes
            canvas.ctx.beginPath();
            let position = this.thisvo.transform.position;
            canvas.ctx.moveTo(position.x + this.vertexes[0].x, position.y + this.vertexes[0].y);
            for (let i = 0; i < this.vertexes.length; i++) {
                canvas.ctx.lineTo(position.x + this.vertexes[i].x, position.y + this.vertexes[i].y);
            }
            canvas.ctx.closePath();
            canvas.ctx.fill();
            canvas.ctx.stroke();
            canvas.ctx.restore();
        }
    }
}

// Sprite renderers render an image, or sprite
class SpriteRenderer extends Renderer {
    constructor (thisvo, src = "") {
        super (thisvo);
        this.sprite = new Image();
        this.sprite.src = src;
        let temp = this;
        this.sprite.onload = function() {
            if (temp.thisvo.transform.width == -1 && temp.thisvo.transform.height == -1) {
                temp.thisvo.transform.width = temp.sprite.naturalWidth;
                temp.thisvo.transform.height = temp.sprite.naturalHeight;
            }
            temp.add();
        }
    }

    add() {
        super.configureCanvas();
        canvas.ctx.drawImage(this.sprite, this.thisvo.transform.position.x - this.thisvo.transform.width / 2, this.thisvo.transform.position.y - this.thisvo.transform.height / 2, this.thisvo.transform.width, this.thisvo.transform.height);
        canvas.ctx.restore();
    }
}

// Colliders are used to detect collisions. They can be used with or without the PhysicsBody
// If no PhysicsBody is attached to the same vObject, then the times to detect a collision are
// determined by the user. If there is, then Collider can be used in two phases.
// More details with the PhysicsBody and Physics Update function later

// The main parent of all colliders. Adds common functionality
class Collider extends Component {
    constructor (thisvo) {
        super (thisvo);
        this.enabled = true;
        this.fixed = false;
        this._vertexes = [];
        // TODO: someohow add a way to do offset translation, rotation, and scaling
        this._offset = {
            _thisvo: thisvo,
            _x: 0,
            _y: 0,
            _rotation: thisvo.transform.rotation,

            get x() {
                return this._x;
            },

            set x(newX) {
                this._thisvo.collider._vertexes.forEach(vertex => {
                    vertex.x = vertex.x - this._x + newX;
                });
                this._x = newX;
            },

            get y() {
                return this._y;
            },

            set y(newY) {
                this._thisvo.collider._vertexes.forEach(vertex => {
                    vertex.y = vertex.y - this._y + newY;
                });
                this._y = newY;
            },

            get rotation() {
                return this._rotation;
            },

            set rotation(amt) {

            }
        };
        this.rotation = 0;
        this.viewable = false;
    }

    get offset() {
        return this._offset;
    }

    set offset(vector) {
        this._offset.x = vector.x;
        this._offset.y = vector.y;
        this._originalProportions.length = 0;
        this._originalVertexes.forEach(vertex => {
            this._originalProportions.push(new Vector2d((vertex.x + vector.x) / this.thisvo.transform.width, (vertex.y + vector.y) / this.thisvo.transform.height));
        });
    }

    collidedWith(other = undefined, returnMTV = false) {
        if (other == undefined) {
            for (let i = 0; i < vObjects.length; i++) {
                if (this.collidedWith(vObjects[i]) && this.thisvo !== vObjects[i]) {
                    return true;
                }
            }
            return false;
        } else if (other.collider != null) {
            // Impementing the SAT Collision Theorem, where we take the normals
            // of each side, use them as axis, and then project the polygon on the axis
            // to check overlaps. Read more here: http://www.dyn4j.org/2010/01/sat/
            // let concatIndex = this.vertexes.length;
            // let allVertexes = [];
            // allVertexes = allVertexes.concat(this.vertexes, other.collider.vertexes);
            let thisVertexes = this.trueVertexes;
            let otherVertexes = other.collider.trueVertexes;
            let normalMTV;
            let smallestOverlap = Infinity;
            let thisPosition = this.thisvo.transform.position;
            let otherPosition = other.transform.position;
            let directionVector = Vector2d.subtract(thisPosition, otherPosition);

            // Start off with the FIRST shape vertexes
            for (let i = 0; i < thisVertexes.length; i++) {
                let thisVertex = Vector2d.add(thisPosition, thisVertexes[i]);
                let nextVertex = Vector2d.add(thisPosition, thisVertexes[i + 1 < thisVertexes.length ? i + 1 : 0]);
                
                // Finding the perpendicular slope. or normal of the side
                let normal = {
                    x: -(nextVertex.y - thisVertex.y),
                    y: nextVertex.x - thisVertex.x
                }
                normal = Vector2d.normalize(normal);
               
                // Check to see if normal is pointing outwards of the shape
                let normalDotDirection = Vector2d.dotProduct(normal, directionVector);
                if (normalDotDirection < 0) {
                    normal = Vector2d.multiply(-1, normal);
                }
                
                // The mins and maxes using the dot product
                // We'll use them to compare to see if they overlap
                let thisMin, otherMin; thisMin = otherMin = Infinity;
                let thisMax, otherMax; thisMax = otherMax = -Infinity;

                // After we find a normal axis to compare to, we run through
                // all of our vertexes, and do the dot product between
                // the vertex and the axis. We store the maxes and mins
                thisVertexes.forEach(vertex => {
                    let dotValue = Vector2d.dotProduct(Vector2d.add(thisPosition, vertex), normal);
                    if (dotValue < thisMin) thisMin = dotValue;
                    if (dotValue > thisMax) thisMax = dotValue;
                });

                // Do the same thing with second collider
                other.collider.vertexes.forEach(vertex => {
                    let dotValue = Vector2d.dotProduct(Vector2d.add(otherPosition, vertex), normal);
                    if (dotValue < otherMin) otherMin = dotValue;
                    if (dotValue > otherMax) otherMax = dotValue;
                });

                // Measure the overlap, and record the smallest one
                let overlap = Infinity;
                if (thisMin >= otherMin && thisMin <= otherMax)  {
                    overlap = otherMax - thisMin;
                } else if (thisMax >= otherMin && thisMax <= otherMax) {
                    overlap = thisMax - otherMin;
                }
                if (overlap < smallestOverlap) {
                    smallestOverlap = overlap;
                    normalMTV = normal;
                }

                // According to SAT, ALL sides must overlap. If even one doesn't overlap, then it's not colliding
                if (!(
                    (thisMin >= otherMin && thisMin <= otherMax) || (thisMax >= otherMin && thisMax <= otherMax) ||
                    (otherMin >= thisMin && otherMin <= thisMax) || (otherMax >= thisMin && otherMax <= thisMax)
                )) {
                    return false;
                }
            }

            // Now do it all over again with the OTHER shape vertexes
            for (let i = 0; i < otherVertexes.length; i++) {
                let thisVertex = Vector2d.add(otherPosition, otherVertexes[i]);
                let nextVertex = Vector2d.add(otherPosition, otherVertexes[i + 1 < otherVertexes.length ? i + 1 : 0]);
                // Finding the perpendicular slope. or normal of the side
                let normal = {
                    x: -(nextVertex.y - thisVertex.y),
                    y: nextVertex.x - thisVertex.x
                }
                normal = Vector2d.normalize(normal);
                // Check to see if normal is pointing outwards of the shape
                let normalDotDirection = Vector2d.dotProduct(normal, directionVector);
                if (normalDotDirection < 0) {
                    normal = Vector2d.multiply(-1, normal);
                }
                // The mins and maxes using the dot product
                // We'll use them to compare to see if they overlap
                let thisMin, otherMin; thisMin = otherMin = Infinity;
                let thisMax, otherMax; thisMax = otherMax = -Infinity;

                // After we find a normal axis to compare to, we run through
                // all of our vertexes, and do the dot product between
                // the vertex and the axis. We store the maxes and mins
                thisVertexes.forEach(vertex => {
                    let dotValue = Vector2d.dotProduct(Vector2d.add(thisPosition, vertex), normal);
                    if (dotValue < thisMin) thisMin = dotValue;
                    if (dotValue > thisMax) thisMax = dotValue;
                });

                // Do the same thing with second collider
                otherVertexes.forEach(vertex => {
                    let dotValue = Vector2d.dotProduct(Vector2d.add(otherPosition, vertex), normal);
                    if (dotValue < otherMin) otherMin = dotValue;
                    if (dotValue > otherMax) otherMax = dotValue;
                });

                // Measure the overlap, and record the smallest one
                let overlap = Infinity;
                if (thisMin >= otherMin && thisMin <= otherMax) {
                    overlap = otherMax - thisMin;
                } else if (thisMax >= otherMin && thisMax <= otherMax) {
                    overlap = thisMax - otherMin;
                }
                if (overlap < smallestOverlap) {
                    smallestOverlap = overlap;
                    normalMTV = normal;
                }

                // According to SAT, ALL sides must overlap. If even one doesn't overlap, then it's not colliding
                if (!(
                    (thisMin >= otherMin && thisMin <= otherMax) || (thisMax >= otherMin && thisMax <= otherMax) ||
                    (otherMin >= thisMin && otherMin <= thisMax) || (otherMax >= thisMin && otherMax <= thisMax)
                )) {
                    return false;
                }
            }
            
            if (returnMTV) {
                let mtv = Vector2d.multiply(smallestOverlap, normalMTV);
                
                return mtv;
            } else {
                return true;
            }
        }
    }
}

class EllipseCollider extends Collider {
    constructor (thisvo) {
        super(thisvo);
    }
}

// Polygon colliders are much complicated, and require much more work if the collider is not convex
// Generally, it is not a good idea to use a polygon collider when not needed
// TODO: refactor this so that instead of having functions with parameters for modifiying the collider shape (using transform functions), it isntead updates independtly
class PolygonCollider extends Collider {
    constructor(thisvo, vertexes = null) {
        super (thisvo);
        // these variables will be used for scaling the collider
        this._originalProportions = [];
        this._originalVertexes = [];
        // NOTE: vertexes is an array that have points that indicate OFFSET FROM POSITION, NOT ITS TRUE POSITION
        // For example, if position is (100, 200) and one vertex is (-50, 20), then the true position of that vertex is (50, 220)
        if (vertexes == null) {
            // if no vertexes given, then assume a rectangle shaped collider
            let upLeft = new Vector2d (-this.thisvo.transform.width / 2, -this.thisvo.transform.height / 2);
            let upRight = new Vector2d (this.thisvo.transform.width / 2, -this.thisvo.transform.height / 2);
            let lowRight = new Vector2d (this.thisvo.transform.width / 2, this.thisvo.transform.height / 2);
            let lowLeft = new Vector2d (-this.thisvo.transform.width / 2, this.thisvo.transform.height / 2);
            this._vertexes = [upLeft, upRight, lowRight, lowLeft];
        } else {
            // deep cloning the vertexes
            this._vertexes = [];
            vertexes.forEach(vertex => {
                this._vertexes.push(new Vector2d(vertex.x, vertex.y));
            });
        }
        // add to proportions
        this._vertexes.forEach(vertex => {
            this._originalProportions.push(new Vector2d(vertex.x / this.thisvo.transform.width, vertex.y / this.thisvo.transform.height));
            this._originalVertexes.push(new Vector2d(vertex.x, vertex.y));
        });
        this.colliderViewer = new PolygonRenderer(thisvo, "rgba(0, 0, 0, 0)", "limegreen", 4, this.vertexes, true);
    }

    // true vertexes refer to the actual vertex position on the canvas (after all the collider transformations and rotations etc)
    get trueVertexes() {
        return this._vertexes;
    }

    // regular vertexes refer to the vertexes position relative to the actual transform position (not including offset)
    get vertexes () {
        return this._originalVertexes;
    }
    
    set vertexes (newVertexes) {
        this._vertexes.length = this._originalProportions.length = this._originalVertexes.length = 0;
        newVertexes.forEach(vertex => {
            this._vertexes.push(new Vector2d(vertex.x, vertex.y));
            this._originalProportions.push(new Vector2d(vertex.x / this.thisvo.transform.width, vertex.y / this.thisvo.transform.height));
            this._originalVertexes.push(new Vector2d(vertex.x, vertex.y));
        });
    }

    // Rotating vertexes requires some funky math I hardly remember
    rotate (degrees = 0) {
        // gotta use radians lol
        let angleRad = degrees * Math.PI / 180;
        this._vertexes.forEach(vertex => {
            // x' = x*cos(a) - y*sin(a)
            // y' = y*cos(a) + x*sin(a)
            let temp = vertex.x;
            vertex.x = vertex.x * Math.cos(angleRad) - vertex.y * Math.sin(angleRad);
            vertex.y = vertex.y * Math.cos(angleRad) + temp * Math.sin(angleRad);
        });
    }

    scale () {
        // rotate vertexes so it's upright, then later rotate back into previous rotation
        this.rotate(-this.thisvo.transform.rotation);
        for (let i = 0; i < this._vertexes.length; i++) {
            this._vertexes[i].x = this._originalProportions[i].x * this.thisvo.transform.width;
            this._vertexes[i].y = this._originalProportions[i].y * this.thisvo.transform.height;
        }
        this.rotate(this.thisvo.transform.rotation);
    }

    updateCollider() {
        // rotate them according to transform rotation
        let angleRad = this.thisvo.transform.rotation * Math.PI / 180;
        for (let i = 0; i < this._vertexes.length; i++) {
            let originalVertex = Vector2d.add(this._originalVertexes[i], this.offset);
            this._vertexes[i].x = originalVertex.x * Math.cos(angleRad) - originalVertex.y * Math.sin(angleRad);
            this._vertexes[i].y = originalVertex.y * Math.cos(angleRad) + originalVertex.x * Math.sin(angleRad);
        }
        // now scale
        this.scale();
    }

    viewCollider() {
        if (this.viewable) {
            // updating the vertexes on the graphic renderer on colliderViewer to match with the true vertices
            this.colliderViewer.vertexes = this._vertexes;
            this.colliderViewer.add();
        }
    }
}

// Box colliders automatically sets up the points to the corners of an vObject (box-like way)
class BoxCollider extends PolygonCollider {
    constructor(thisvo) {
        super(thisvo);
    }
}

// Physics bodies record/update current velocity and acceleration
// NOTE: the PhysicsBody component is NOT responsible for calculating changes in sudden acceleration
// Neither is it responsible for moving the vObject to velocity. PhysicsBody is merely data holder
// Instead, the physics engine, which is described later, is responsible for those calculations
class PhysicsBody extends Component {
    constructor (thisvo) {
        super (thisvo);
        this.enabled = true;
        this.isKinematic = false;
        this.mass = 1;
        this.gravity = 1;
        this.acceleration = new Vector2d(0, this.gravity);
        this.velocity = new Vector2d();
        this.lastAcceleration = new Vector2d(0, this.gravity);
    }

    addForce(x, y) {
        this.acceleration.x += x / this.mass;
        this.acceleration.y += y / this.mass;
    }
}

// The starting class for all vObjects. A vObject will hold nothing except for a Transform component
// Later, it can be added more components
class vObject {
    constructor(px, py) {
        this.transform = new Transform(this, px, py);
        vObjects.push(this);
    }

    addComponent(componentName) {
        switch (componentName) {
            case "GraphicRenderer":
                this.renderer = new GraphicRenderer(this);
                break;
            case "SpriteRenderer":
                this.renderer = new SpriteRenderer(this);
                break;
            case "BoxCollider":
                this.collider = new BoxCollider(this);
                break;
            case "PolygonCollider":
                this.collider = new PolygonCollider(this);
                break;
            case "PhysicsBody":
                this.physicsBody = new PhysicsBody(this);
                break;
            default:
                return null;
        }
    }

    removeComponent(componentName) {
        
    }

    destroy() {
        
    }
}

// A vObject that automatically makes an image, or Sprite
class Sprite extends vObject {
    constructor(src = "", x = 0, y = 0, width = -1, height = -1) {
        super(x, y);
        this.transform.width = width;
        this.transform.height = height;
        this.renderer = new SpriteRenderer(this, src);
    }
}

// A vObject that automatically makes a basic rectangle
class Rectangle extends vObject {
    constructor(x = 0, y = 0, width = 0, height = 0, color = "black", strokeColor = "rgba(0, 0, 0, 0)", strokeWidth = 0) {
        super (x, y);
        this.transform.width = width;
        this.transform.height = height;
        this.renderer = new RectRenderer(this, color, strokeColor, strokeWidth);
    }
}

// A vObject that automatically makes a...you guess it, polygon
class Polygon extends vObject {
    constructor(x, y, vertexes = null, color = "black", strokeColor = "rgba(0, 0, 0, 0)", strokeWidth = 0) {
        super (x, y);
        // NOTE: vertexes is an array that have points that indicate OFFSET FROM POSITION, NOT ITS TRUE POSITION
        // For example, if position is (100, 200) and one vertex is (-50, 20), then the true position of that vertex is (50, 220)
        // get the max and min x and y to get entire width and height
        let max = new Vector2d(vertexes[0].x, vertexes[0].y);
        let min = new Vector2d(vertexes[0].x, vertexes[0].y);
        vertexes.forEach(vertex => {
            if (vertex.x > max.x) max.x = vertex.x;
            if (vertex.y > max.y) max.y = vertex.y;
            if (vertex.x < min.x) min.x = vertex.x;
            if (vertex.y < min.y) min.y = vertex.y;
        });
        this.transform.width = max.x - min.x;
        this.transform.height = max.y - min.y;
        // after setting up transform properties, set up renderer with vertexes etc
        this.renderer = new PolygonRenderer(this, color, strokeColor, strokeWidth, vertexes);
    }
}

// Graphics updater
function RenderersUpdate () {
    canvas.clear();
    vObjects.forEach(vObject => {
        if (vObject.renderer != null) {
            vObject.renderer.add();
        }
        if (vObject.collider != null && vObject.collider.viewable) {
            vObject.collider.viewCollider();
        }
    });
}

// TODO: improve physics collisions and engine. mtv kinda works now. Not perfect
// Physics updater
function PhysicsUpdate() {
    vObjects.forEach(vObject => {
        let collider = vObject.collider;
        let physicsBody = vObject.physicsBody;
        
        // check if there's actually a valid physicsBody on this vObject
        if (physicsBody != null && physicsBody.enabled) {
            
            // applying those physics
            if (!physicsBody.isKinematic) {
                // physicsBody.velocity.x += physicsBody.acceleration.x;
                // physicsBody.velocity.y += physicsBody.acceleration.y;
            }
            vObject.transform.translate(physicsBody.velocity.x, physicsBody.velocity.y);
            
            // making sure collisions occur and objects are moved appropriately
            // first check if our collider is good
            if (collider != null && collider.enabled) {
                vObjects.forEach(other => {
                    // first check if it is the same object or not
                    if (other !== vObject) {
                        // check if collider on other object is good
                        if (other.collider != null && other.collider.enabled) {
                            // check if physicsBody on other object is good
                            if (other.physicsBody != null && other.physicsBody.enabled) {
                                // applied it to both.
                                /*
                                    If you only apply to one object, then it will move out the way, thus when we loop to the next object
                                    that object will not move because the previous object has already moved out the way, thus no need for the
                                    second object to move
                                */
                                let mtv = collider.collidedWith(other, true);
                                let otherMtv = other.collider.collidedWith(vObject, true);
                                vObject.transform.translate(mtv.x, mtv.y);
                                other.transform.translate(otherMtv.x, otherMtv.y);
                            }
                        }
                    }
                });
            }
        }
    });
}

// Input object, with commands
let Input = {
    // keyboard input
    key: {
        // keeps track of key events, for faster response time
        // order of events: keydown (presses a key), keypress (holds a key), keyup (releases key), nokey (key stays up)
        keyStates: {},
        // setup the document to recognize input
        initialize: function () {
            document.onkeydown = function (e) {
                // key is keydown the very first time it is being pressed. after 15ms, it will be set to keypress
                if (Input.key.keyStates[e.keyCode] != "keypress") {
                    Input.key.keyStates[e.keyCode] = "keydown";
                    setTimeout(function () { Input.key.keyStates[e.keyCode] = "keypress" }, 15);
                }
            }
            //key is keyup the first first time it is being released. after 15ms, it will be set to nokey
            document.onkeyup = function (e) {
                Input.key.keyStates[e.keyCode] = "keyup";
                setTimeout(function () { Input.key.keyStates[e.keyCode] = "nokey" }, 15);
            }
        },
        getKeyDown: function (input) {
            return (this.keyStates[input] == "keydown") ? true : false;
        },
        anyKeyDown: function () {

        },
        getKeyPressed: function (input) {
            return (this.keyStates[input] == "keypress") ? true : false;
        },
        getKeyUp: function (input) {
            return (this.keyStates[input] == "keyup") ? true : false;
        }
    },

    // mouse input
    mouse: {
        mouseStates: { moving: false },
        position: { x: 0, y: 0 },
        canvasBox: canvas.canvas.getBoundingClientRect(),
        initialize: function () {
            canvas.canvas.onmousedown = function (e) {
                Input.mouse.mouseStates[e.button] = "down";
            }
            canvas.canvas.onmouseup = function (e) {
                Input.mouse.mouseStates[e.button] = undefined;
            }
            canvas.canvas.onclick = function (e) {
                Input.mouse.mouseStates[e.button] = "clicked";
                setTimeout(function () { Input.mouse.mouseStates[e.button] = undefined }, 100);
            }
            canvas.canvas.ondblclick = function (e) {
                Input.mouse.mouseStates[e.button] = "dblclicked";
            }
            canvas.canvas.onmousemove = function (e) {
                Input.mouse.position.x = e.clientX - Input.mouse.canvasBox.x;
                Input.mouse.position.y = e.clientY - Input.mouse.canvasBox.y;
                Input.mouse.mouseStates.moving = true;
                setTimeout(function () { Input.mouse.mouseStates.moving = false }, 100);
            }
        },
        onMouseDown: function (input) {
            return (this.mouseStates[input] == "down") ? true : false;
        },
        onMouseUp: function (input) {
            return (this.mouseStates[input] == undefined) ? true : false;
        },
        onMouseClick: function (input) {
            if (this.mouseStates[input] == "clicked") {
                this.mouseStates[input] = undefined;
                return true;
            } else {
                return false;
            }
        },
        onMouseDblClick: function (input) {
            if (this.mouseStates[input] == "dblclicked") {
                this.mouseStates[input] = undefined;
                return true;
            } else {
                return false;
            }
        },
        onMouseMove: function () {
            return (this.mouseStates.moving) ? true : false;
        },
        onMouseDrag: function () {
            return (this.mouseStates.moving && this.mouseStates[0] == "down") ? true : false;
        }
    }
};

// 2D Vector class. Holds x and y variables
class Vector2d {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    get magnitude() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    static add(vector1, vector2) {
        return new Vector2d(vector1.x + vector2.x, vector1.y + vector2.y);
    }

    static subtract(vector1, vector2) {
        return new Vector2d(vector1.x - vector2.x, vector1.y - vector2.y);
    }

    static multiply(scalar, vector) {
        return new Vector2d(vector.x * scalar, vector.y * scalar);
    }

    static divide(scalar, vector) {
        return new Vector2d(vector.x / scalar, vector.y / scalar);
    }

    static dotProduct(vector1, vector2) {
        return (vector1.x * vector2.x) + (vector1.y * vector2.y);
    }

    static normalize (vector) {
        if (vector.x == 0 && vector.y == 0) {
            return new Vector2d(0, 0);
        }
        return Vector2d.multiply(1 / Math.sqrt(vector.x ** 2 + vector.y ** 2), vector);
    }
}