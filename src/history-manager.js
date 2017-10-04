const Promise = window.Promise || require('bluebird');

class HistoryManager {
  constructor(canvas) {
    this.history = [];
    this.historyIndex = -1;
    this.canvas = canvas;
    this.objectIdCounter = 1;
  }

  pushNewFabricObject(fabricObject) {
    if(this.historyIndex > -1) {
      this.history.splice(this.historyIndex + 1);
    }

    fabricObject.stickerbookObjectId = this.objectIdCounter;

    this.history.push([{
      type: 'add',
      data: JSON.stringify(fabricObject),
      objectId: this.objectIdCounter
    }]);
    this.historyIndex++;
    this.objectIdCounter++;
  }

  pushPropertyChange(property, objectIndex, oldValue, newValue) {
    this.pushPropertyChanges([{ property, objectIndex, oldValue, newValue }]);
  }

  pushPropertyChanges(changes) {
    if(this.historyIndex > -1) {
      this.history.splice(this.historyIndex + 1);
    }

    // perform a quick validation
    var isValid = changes.every(change => {
      return change.objectIndex !== undefined && change.property !== undefined
        && change.oldValue !== undefined && change.newValue !== undefined;
    });

    if(!isValid) {
      throw new Error('Changes passed are not valid');
    }

    var historyEvents = changes.map(change => {
      return { type: 'change', data: change };
    });
    this.history.push(historyEvents);
    this.historyIndex++;
  }

  undo() {
    if(this.historyIndex === -1) {
      return Promise.resolve(this);
    }

    const processChange = currentChange => {
      return new Promise((resolve, reject) => {
        if(currentChange.type === 'add') {
          var oldItemIndex = this.canvas.getObjects()
            .map(JSON.stringify)
            .indexOf(currentChange.data);

          if(oldItemIndex > -1) {
            this.canvas.remove(this.canvas.getObjects()[oldItemIndex]);
          }
        } else if(currentChange.type === 'change') {
          var object = this.canvas.getObjects()[currentChange.data.objectIndex];
          if(object === undefined) {
            var message = 'Attempted to retrieve object ' + currentChange.data.objectIndex
              + ' but it\'s not there';
            reject(new Error(message));
            return;
          }

          object.set(currentChange.data.property, currentChange.data.oldValue);
          object.setCoords();
        }
        resolve(this);
      });
    };

    var promises = this.history[this.historyIndex].map(processChange);
    return Promise.all(promises).then(() => {
      this.historyIndex--;
      this.canvas.renderAll();
      return;
    });
  }

  redo() {
    if(this.historyIndex >= this.history.length - 1) {
      return Promise.resolve();
    }

    const processChange = newChange => {
      return new Promise((resolve, reject) => {
        if(newChange.type === 'add') {
          var parsed = JSON.parse(newChange.data);
          fabric.util.enlivenObjects([parsed], results => {
            if(results.length < 1) {
              reject(this);
              return;
            }
            results[0].stickerbookObjectId = newChange.objectId;
            this.canvas.add(results[0]);
            resolve(this);
          });
        } else if(newChange.type === 'change') {
          var object = this.canvas.getObjects()[newChange.data.objectIndex];
          if(object === undefined) {
            var message = 'Attempted to retrieve object ' + newChange.data.objectIndex
              + ' but it\'s not there';
            reject(new Error(message));
            return;
          }

          object.set(newChange.data.property, newChange.data.newValue);
          object.setCoords();
          resolve(this);
        }
      });
    };

    var promises = this.history[this.historyIndex + 1].map(processChange);
    return Promise.all(promises).then(() => {
      this.historyIndex++;
      this.canvas.renderAll();
      return this;
    });
  }
}

module.exports = HistoryManager;
