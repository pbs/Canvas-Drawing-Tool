/* eslint-env mocha */
'use strict';

const expect = require('expect');
const sinon = require('sinon');

const HistoryManager = require('../src/history-manager');
const EventHandlers = require('../src/event-handlers');

describe('EventHandlers', () => {

  var canvas;
  var historyManager;

  beforeEach(() => {
    canvas = new fabric.Canvas(
      fabric.document.createElement('canvas'), {
        width: 100,
        height: 100,
        enableRetinaScaling: false,
        selection: false
      });
    historyManager = new HistoryManager(canvas);
  });

  afterEach(() => {
    canvas.dispose();
  });

  describe('recordObjectAddition', () => {
    beforeEach(() => {
      canvas.on('object:added', evt => EventHandlers.recordObjectAddition(historyManager, evt));
    });

    it('should not attempt to add an object that has already been added', (done) => {
      var path = new fabric.Path('M 0 0');

      historyManager.pushNewFabricObject(path);

      historyManager
        .undo()
        .then(() => historyManager.redo())
        .then(() => {
          expect(historyManager.history.length).toEqual(1);
          done();
        })
        .catch(done);
    });

    it('should add an object if it has never been added', () => {
      expect(historyManager.history.length).toEqual(0);

      var path = new fabric.Path('M 0 0');
      canvas.add(path);

      expect(historyManager.history.length).toEqual(1);
    });
  });

  describe('recordPropertyChange', () => {
    beforeEach(() => {
      canvas.on('object:modified', evt => EventHandlers.recordPropertyChange(historyManager, evt));
    });

    it('should correctly detect the properties that have changed', () => {
      var path = new fabric.Path('M 0 0', {
        angle: 0,
        left: 10,
        top: 20,
        scaleX: 1,
        scaleY: 1
      });

      canvas.add(path);
      historyManager.pushNewFabricObject(path);

      path.set({
        angle: 10,
        top: 15,
        scaleX: 2
      });

      // simulate a mouse up (http://fabricjs.com/docs/fabric.js.html#line10707)
      canvas.fire('object:modified', { target: path });

      expect(historyManager.history.length).toEqual(2);
      expect(historyManager.history[1].length).toEqual(3);
      expect(historyManager.history[1][0].data).toInclude({ property: 'scaleX', oldValue: 1,  newValue: 2  });
      expect(historyManager.history[1][1].data).toInclude({ property: 'angle',  oldValue: 0,  newValue: 10 });
      expect(historyManager.history[1][2].data).toInclude({ property: 'top',    oldValue: 20, newValue: 15 });
    });

    it('should correct detect the last change event for a property as well', () => {
      var path = new fabric.Path('M 0 0', { angle: 0, });
      canvas.add(path);
      historyManager.pushNewFabricObject(path);

      // set a property on the path (should be auto-tracked in history)
      path.set('angle', 10);
      canvas.fire('object:modified', { target: path });

      // set the property again
      path.set('angle', 20);
      canvas.fire('object:modified', { target: path });

      expect(historyManager.history.length).toEqual(3);
      expect(historyManager.history[2].length).toEqual(1);
      expect(historyManager.history[2][0].data.oldValue).toEqual(10);
      expect(historyManager.history[2][0].data.newValue).toEqual(20);
    });
  });
});
