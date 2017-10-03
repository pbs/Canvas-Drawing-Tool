/* eslint-env mocha */
'use strict';

const expect = require('expect');
const sinon = require('sinon');

const HistoryManager = require('../src/history-manager');

describe('HistoryManager', () => {
  var historyManager = null;
  beforeEach(() => {
    var fabricCanvas = new fabric.Canvas(
      fabric.document.createElement('canvas'), {
        width: 100,
        height: 100,
        enableRetinaScaling: false,
        selection: false
      });
    historyManager = new HistoryManager(fabricCanvas);
  });

  afterEach(() => {
    historyManager.canvas.dispose();
    delete historyManager.canvas;
  });

  it('should initialize with empty state', () => {
    expect(historyManager.history.length).toEqual(0);
    expect(historyManager.historyIndex).toEqual(-1);
  });

  describe('pushing new state', () => {
    it('should be able to store object additions', () => {
      var path = new fabric.Path('M 0 0', { });
      historyManager.pushNewFabricObject(path);

      expect(historyManager.historyIndex).toEqual(0);
      expect(historyManager.history.length).toEqual(1);
      expect(historyManager.history[0][0].type).toEqual('add');
    });

    it('should attach an object id', () => {
      var path = new fabric.Path('M 0 0', { });
      historyManager.pushNewFabricObject(path);

      expect(historyManager.history[0][0].objectId).toNotEqual(undefined);
      expect(path.stickerbookObjectId).toNotEqual(undefined);
    });

    it('should be able to store property changes', () => {
      historyManager.pushPropertyChange('scaleX', 2, 1.0, 1.5);

      expect(historyManager.historyIndex).toEqual(0);
      expect(historyManager.history.length).toEqual(1);
    });
    
    it('should wipe any redoable state if a new object is added', () => {
      // some fake history, then undo the second
      historyManager.pushPropertyChange('scaleX', 0, 1, 2);
      historyManager.pushPropertyChange('scaleY', 0, 2, 3);
      historyManager.historyIndex = 0;

      // add a new object, which should wipe this new undo state
      var path = new fabric.Path('M 0 0', { });
      historyManager.pushNewFabricObject(path);

      expect(historyManager.historyIndex).toEqual(1);
      expect(historyManager.history.length).toEqual(2);
      expect(historyManager.history[0][0].data.property).toEqual('scaleX');
      expect(historyManager.history[1][0].type).toEqual('add');
    });

    it('should wipe any redoable state if a property is changed', () => {
      // some fake history, then undo the second
      historyManager.pushPropertyChange('scaleX', 0, 1, 2);
      historyManager.pushPropertyChange('scaleY', 0, 2, 3);
      historyManager.historyIndex = 0;

      // add a new object, which should wipe this new undo state
      historyManager.pushPropertyChange('scaleX', 0, 2, 3);

      expect(historyManager.historyIndex).toEqual(1);
      expect(historyManager.history.length).toEqual(2);
      expect(historyManager.history[0][0].data.property).toEqual('scaleX');
      expect(historyManager.history[1][0].data.property).toEqual('scaleX');
    });
  });

  describe('undo', () => {
    it('should remove an item if the undo item is an addition', (done) => {
      var path = new fabric.Path('M 0 0', { stroke: 'red' });
      historyManager.canvas.add(path);
      expect(historyManager.canvas.getObjects().length).toEqual(1);
      
      historyManager.pushNewFabricObject(path);
      expect(historyManager.history.length).toEqual(1);

      historyManager.undo().then(() => {
        expect(historyManager.canvas.getObjects().length).toEqual(0);
        expect(historyManager.history.length).toEqual(1);
        expect(historyManager.historyIndex).toEqual(-1);
        done();
      }).catch(done);
    });

    it('should change a property to its original value if it is a property change', (done) => {
      var path = new fabric.Path('M 0 0', { stroke: 'red' });
      historyManager.canvas.add(path);
      historyManager.pushPropertyChange('stroke', 0, 'blue', 'red');

      historyManager.undo().then(() => {
        expect(path.stroke).toEqual('blue');
        expect(historyManager.history.length).toEqual(1);
        expect(historyManager.historyIndex).toEqual(-1);
        done();
      }).catch(done)
    });

    it('should no do anything if there is no previous state', (done) => {
      historyManager.undo().then(() => {
        expect(historyManager.history.length).toEqual(0);
        expect(historyManager.historyIndex).toEqual(-1);
        done();
      }).catch(done)
    });
  });

  describe('redo', () => {
    it('should re-add an object if the next undo state was an add', (done) => {
      var path = new fabric.Path('M 0 0', { stroke: 'red' });
      historyManager.pushNewFabricObject(path);
      historyManager.historyIndex = -1;

      historyManager.redo().then(() => {
        expect(historyManager.canvas.getObjects().length).toEqual(1);
        expect(historyManager.historyIndex).toEqual(0);
        done();
      }).catch(done);
    });

    it('should recover the object id upon redo', (done) => {
      var path = new fabric.Path('M 0 0', { stroke: 'red' });
      historyManager.history.push([{
        type: 'add',
        data: JSON.stringify(path),
        objectId: 12345
      }]);

      historyManager.redo().then(() => {
        expect(historyManager.canvas.getObjects().length).toEqual(1);
        expect(historyManager.canvas.getObjects()[0].stickerbookObjectId).toEqual(12345);
        done();
      }).catch(done)
    });

    it('should reapply a property change if the next undo state was a change', (done) => {
      var path = new fabric.Path('M 0 0', { stroke: 'red' });
      historyManager.canvas.add(path);
      historyManager.pushPropertyChange('stroke', 0, 'red', 'blue');
      historyManager.historyIndex = -1;

      historyManager.redo().then(() => {
        expect(historyManager.historyIndex).toEqual(0);
        expect(path.stroke).toEqual('blue');
        done();
      }).catch(done);
    });

    it('should reapply multiple property changes if the next redo state has two things in it', (done) => {
      var path = new fabric.Path('M 0 0', { stroke: 'red' });
      historyManager.canvas.add(path);
      historyManager.pushPropertyChanges([
        {
          objectIndex: 0,
          property: 'stroke',
          oldValue: 'red',
          newValue: 'blue'
        },
        {
          objectIndex: 0,
          property: 'scaleX',
          oldValue: 1,
          newValue: 2
        }
      ]);
      historyManager.historyIndex = -1;

      historyManager.redo().then(() => {
        expect(historyManager.historyIndex).toEqual(0);
        expect(path.stroke).toEqual('blue');
        expect(path.scaleX).toEqual(2);
        done();
      }).catch(done);
    });
    
    it('should do nothing if there is no next state', (done) => {
      historyManager.redo().then(() => {
        expect(historyManager.history.length).toEqual(0);
        expect(historyManager.historyIndex).toEqual(-1);
        done();
      }).catch(done);
    });
  });
});
