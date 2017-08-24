# Canvas Drawing Tool
[![Build Status](https://travis-ci.org/pbs/Canvas-Drawing-Tool.svg?branch=master)](https://travis-ci.org/pbs/Canvas-Drawing-Tool)

## Basic Usage
To create a stickerbook, you'll first need to include the script on the page:
```html
<script src="node_modules/pbs-kids-canvas-drawing/dist/stickerbook.dist.js"></script>
```

If you'd like, there's also an unminified debug build available too if you need to debug anything:
```html
<script src="node_modules/pbs-kids-canvas-drawing/dist/stickerbook.combined.js"></script>
```

Now, create a containing element for the stickerbook and instantiate
```javascript
var container = document.getElementById('stickerbook-container');
document.body.appendChild(container);

var stickerBook = new Stickerbook({
  // The containing element for the stickerbook
  container : container,

  // the available stickers that can be used
  stickers: [
    'path/to/first/image.png',
    'path/to/other/image.png'
  ],

  background: {
    // the backgrounds that can be set
    enabled: [
        'first/bg.png',
        'other/bg.png'
    ],
    
    // the default background to use (can be null for empty background)
    default: 'first/bg.png'
  },

  brush: {
    // The available brushes. The list below has the all the currently available ones (at the time of writing)
    enabled: [
      'eraser',
      'bitmap',
      'bitmap-eraser',
      'fill',
      'marker',
      'pattern',
      'pencil',
      'spray',

      // a custom brush configured below
      'mycustombrush'
    ], 
    
    // The available brush widths (in pixels)
    widths: [1, 10],

    // The available colors to use, can be any valid CSS color
    colors: [
      '#0000FF',
      '#FF0000'
    ],

    // any custom brushes, the key of this object are the id to be used in the enabled list above, and the value must
    // be a subclass of fabric.BaseBrush (via fabric.util.createClass(fabric.BaseBrush, { }) )
    custom: {
      mycustombrush: MyCustomBrush
    }
  },

  // Whether or not to enable touch events
  mobileEnabled: true,

  // styling options for sticker sizing controls (optional)
  stickerControls: {
    cornerColor: 'rgba(0,0,0,0.5)',
    cornerSize: 20,
    hasBorders: true
  },

  // Whether or not to use default event handlers (see "Events" below)
  useDefaultEventHandlers: true
});
```
Note that the canvas fits to fill the containing element, so any height and width rules you've set will apply to the
canvases inside. We advocate that you use [viewport units](https://drafts.csswg.org/css-values-3/#viewport-relative-lengths)
to maintain aspect ratio, so that scaling preserves sizes properly. We'll loosen that suggestion as we improve our
resizing algorithm. However, in the meantime the demo code stylesheet has an example of how to do this.

## Available Methods
### Rerendering
You can always re-render the stickerbook by hand using the `triggerRender` method. This will simply call the internal
fabric instance's `renderAll`. However, if you'd like to not only re-render but also want to recalculate positioning
(due to a change in the container size etc.), you can call `resize` which will recalculate positioning for each canvas
element and then redraw.

### Undo and Redo
Any operation that was previously done can be undone (or redone) via the `undo` and `redo` method respectively:
```javascript
// do some stuff
stickerbook.undo();

// oh wait, I wanted to keep that! Give it back!
stickerbook.redo();

// bloodPressure--;
```

### Setters
Brushes, stickers, and the background can all be set on the fly. Keep in mind that they are validated when set, so if
you attempt to set a brush/sticker/background that is not enabled, an Error will be thrown. Here's an example:
```javascript
stickerbook.setSticker('some/enabled/sticker.png');
stickerbook.setBrush('pencil');
stickerbook.setBrushWidth(10);
stickerbook.setBackground('some/enabled/bg.png');

try {
    // this color is not enabled
    stickerbook.setColor('PapayaWhip');
} catch(e) {
    alert('ORLY?');
}
```
Note that `stickerbook.setSticker` is _ansynchronous_ due to the fact the browser will have to load the image before it
can add it to the canvas. Therefore, `stickerbook.setSticker` returns a promise that resolves to the stickerbook once
the image has loaded.

Along with setting the background, you can remove it too:
```javascript
stickerbook.clearBackground();
```

You can also programmatically unselect any UI items with
```javascript
stickerbook.deselectAll();
```

#### Configurable Brushes
When setting a brush via `setBrush`, some brushes allow for configuration to be provided for that brush.

##### Bitmap Brush
The bitmap brush takes an image and turns it into a "stamp" by replacing it's RGB channels with the color you specify.
It preserves the alpha channel however, so you can use that shape the stamp in any way you want. Here's an example
usage:

```javascript
stickerbook.setBrush('bitmap', {
  image: 'pathToSomeImage' // the image to sample
});
```

However, don't forget to enable this brush!

##### Bitmap Eraser Brush
The bitmap eraser behaves exactly like the bitmap brush, but works as an eraser instead:

```javascript
stickerbook.setBrush('bitmap-eraser', {
  image: 'pathToSomeImage' // the image to sample
});
```

##### Pattern Brush
The pattern brush takes an array of images and stamps them as the user drags their mouse/finger across the canvas. Here is an example configuration:

```javascript
stickerbook.setBrush('pattern', {
  images: [
    'image1',
    'image2'
  ]
})
```

### Exporting
You can also export the stickerbook to a data url for saving, printing, whatever like so:

```javascript
var dataUrl = stickerbook.toDataURL();

// now, go hog-wild
// courtesy of http://stackoverflow.com/a/2909070
var html = "<!DOCTYPE html>\n<html><body><img src=\"" + dataUrl + "\"/></body></html>";
var popup = window.open();
popup.document.write(html);
popup.focus();
popup.print();
```

The above example will attempt to print the image. You can download and save to camera roll with even less code:
```javascript
window.location.href = stickerbook.toDataURL().replace("image/png", "image/octet-stream");
```

Bear in mind that this the internal `toDataURL()` call we make to the canvas element will fail if any sticker
placed on the canvas came from a different origin (perhaps a CDN or the like). This can alleviated by setting the
proper `Access-Control-Allow-Origin` header on the resource to allow it to be used freely by your page.

## Background Positioning
The stickerbook provides background positioning methods, so you can adjust how the background looks as your canvas
scales and grows. There are three options (currently):

```javascript
stickerbook.backgroundManager.setPositioning('default');
stickerbook.backgroundManager.setPositioning('fit-height');
stickerbook.backgroundManager.setPositioning('fit-width');
```

`default` is the default behavior, and simply positions the image in the top corner with no scaling at all.
`fit-height` will scale the image so that it is as tall as the canvas and centered horizontally. `fit-width` is the
opposite and fills the image horizontally, while centering it vertically. If an unknown option is provided for
positioning, the default will be used.

You can also provide positioning that fits once, but never scales again (after a canvas resize for instance):
`fit-width-no-rescale` and `fit-height-no-rescale` will acheive this. This are helpful for maintaining the background
image's position relative to the position of the drawings on the canvas.

## Events

A stickerbook instance fires events from the underlying Fabric canvas, and you can register custom callbacks to respond to them using the `on` and `off` methods.

If you configure the stickerbook with `useDefaultEventHandlers: true`, it will register built-in event handlers for manipulating stickers with mouse and touch events. With `useDefaultEventHandlers: true`, those handlers won't be registered. See `event-handlers.js` for the source code of the default handlers.

You can register callbacks for the following events:

* `'before:selection:cleared',`
* `'mouse:down',`
* `'mouse:move',`
* `'mouse:out',`
* `'mouse:over',`
* `'mouse:up',`
* `'object:modified',`
* `'object:moving',`
* `'object:rotating',`
* `'object:scaling',`
* `'object:selected',`
* `'path:created',`
* `'selection:cleared',`
* `'selection:created',`
* `'touch:drag',`
* `'touch:gesture',`
* `'touch:longpress',`
* `'touch:orientation',`
* `'touch:shake'`

```javascript
stickerbook.on('touch:longpress', function handleLongPress(evt) {
  // custom logic...
});
```

You can also de-register event handlers
```javascript
const handleLongPress = function (evt) {
  // custom logic...
};
stickerbook.on('touch:longpress', handleLongPress);

// later, we want to remove this handler
stickerbook.off('touch:longpress', handleLongPress);
```

## Sticker manipulation

It's possible to manipulate stickers directly, for example in custom event handlers:

```javascript
stickerbook.getTopSticker().setAngle(90);
stickerbook.triggerRender();

```

Remember to call `triggerRender()` to make your manipulations visible.

low-level sticker API is from fabric:

http://fabricjs.com/docs/fabric.Object.html

Example methods:

`sticker.setAngle()` (http://fabricjs.com/docs/fabric.Object.html#setAngle)
`sticker.scale()` (http://fabricjs.com/docs/fabric.Object.html#scale)

If you have called `stickerbook.setSticker` with some url, you can place the image programmatically as well. By calling
`stickerbook.placeSticker({ x: 0, y: 0 })` you can place an image manually onto the canvas. You can also provide an
optional `xScale`, `yScale` and `rotation` to place the image in a particular starting layout.

## Finishing Up
If you're done with the stickerbook, you can simply call `stickerbook.destroy()` to remove any DOM
nodes, listeners, memory added by the stickerbook. However, it will *not* remove the container you
provide. Please note that when you call `destroy`, the stickerbook is no longer usable and any
method call is then considered *undefined behavior*.

## Building for development
If you're of a mind to build yourself, you'll need to have `gulp` installed globally (`npm install -g gulp`).
Then, you can clone the repo and run
```
npm install
gulp build
```
to build yourself.

If you'd like to do some development as well, run `gulp` rather than `gulp build` and then open http://localhost:8000/
in your browser of choice. As you edit files in `src/`, the stickerbook will be rebuilt, but you'll need to refresh
the page yourself (sorry, no live-reload at the time of writing).

You can also run your own tests with `npm run test`. You can also see the test suite run by opening `test/index.html`
in a browser after running `gulp build-test`.
