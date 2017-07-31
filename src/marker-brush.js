
// based on
// https://github.com/tennisonchan/fabric-brush/blob/master/src/brushes/marker_brush.js
const MarkerBrush = fabric.util.createClass(fabric.PencilBrush, {
  initialize: function (canvas) {
    this.canvas = canvas;
    this.points = [];
    this._lineWidth = 3;
    this._lastPoint = null;
  },

  onMouseUp: function () {
    const context = this.canvas.contextTop;
    const canvas = this.canvas;
    context.closePath();

    const pathData = this._getSvgPaths();
    const paths = pathData.map((d) => {
      return this.createPath(d);
    });

    // use a group here to improve performance
    const pathGroup = new fabric.Group(paths);
    pathGroup.selectable = false;

    // we're going to clear and render manually after this, so disable
    // auto-rendering to improve performance
    canvas.renderOnAddRemove = false;
    canvas.add(pathGroup);
    canvas.renderOnAddRemove = true;

    canvas.clearContext(canvas.contextTop);
    canvas.renderAll();
    this.canvas.fire('path:created', {path: pathGroup});
  },

  onMouseDown: function (point) {
    // canvas setup
    this._prepareForDrawing();
    // set point to begin drawing from
    this._recordPoint(point);
  },

  onMouseMove: function (point) {
    this._render(point);
  },

  _recordPoint: function (point) {
    this._lastPoint = point;
    this.points.push(point);
  },

  _prepareForDrawing: function () {
    this.canvas.contextTop.lineJoin = 'round';
    this.canvas.contextTop.lineCap = 'round';
    this.canvas.contextTop.strokeStyle = this.color;
    this.canvas.contextTop.lineWidth = this._lineWidth;
    this.points = [];
  },

  _render: function (point) {
    const context = this.canvas.contextTop;
    context.beginPath();

    const size = this.width;
    const lineWidth = this._lineWidth;
    const lastPoint = this._lastPoint;
    const offsetLimit = (size / lineWidth) / 2;

    // we're drawing a series of lines, each offset slightly differently
    for(var offsetFactor = 0; offsetFactor < offsetLimit; offsetFactor++) {
      const offset = (lineWidth - 1) * offsetFactor;
      context.moveTo(lastPoint.x + offset, lastPoint.y + offset);
      context.lineTo(point.x + offset, point.y + offset);
      context.stroke();
    }

    this._recordPoint(point);
  },

  _getSvgPaths: function () {
    const points = this.points;

    const lineWidth = this._lineWidth;
    const size = this.width;
    const offsetLimit = (size / lineWidth) / 2;

    var paths = [];
    for(var offsetFactor = 0; offsetFactor < offsetLimit; offsetFactor++) {
      paths.push(this._calcPathWithOffset(points, offsetFactor, lineWidth));
    }
    return paths;
  },

  _calcPathWithOffset: function (points, offsetFactor, lineWidth) {
    const offset = (lineWidth - 1) * offsetFactor;
    let path = [];
    let i;
    let p1 = new fabric.Point(points[0].x, points[0].y);

    if(points.length < 2) {
      return 'M ' + p1.x + ' ' + p1.y;
    }

    let p2 = new fabric.Point(points[1].x, points[1].y);

    // 'M' means "moveTo, absolute"
    path.push(
      'M ',
      points[0].x,
      ' ',
      points[0].y,
      ' '
    );

    for (i = 1; i < points.length; i++) {
      var midPoint = p1.midPointFrom(p2);
      // 'Q' means "QuadraticCurveTo, absolute"
      path.push(
        'Q ',
        p1.x + offset,
        ' ',
        p1.y + offset,
        ' ',
        midPoint.x + offset,
        ' ',
        midPoint.y + offset,
        ' '
      );
      p1 = new fabric.Point(points[i].x, points[i].y);
      if ((i + 1) < points.length) {
        p2 = new fabric.Point(points[i + 1].x, points[i + 1].y);
      }
    }
    // 'L' means "lineto, absolute"
    path.push(
      'L ',
      p1.x + offset,
      ' ',
      p1.y + offset,
      ' '
    );
    return path.join('');
  },


  /**
  * Creates fabric.Path object to add on canvas
  * @param {String} pathData Path data
  * @return {fabric.Path} Path to add on canvas
  */
  createPath: function (pathData) {
    var path = new fabric.Path(pathData, {
      fill: null,
      stroke: this.color,
      strokeWidth: this._lineWidth,
      strokeLineCap: this.strokeLineCap,
      strokeLineJoin: this.strokeLineJoin,
      strokeDashArray: this.strokeDashArray,
      originX: 'center',
      originY: 'center'
    });
    if (this.shadow) {
      this.shadow.affectStroke = true;
      path.setShadow(this.shadow);
    }
    return path;
  }

});

module.exports = MarkerBrush;
