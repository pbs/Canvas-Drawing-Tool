const Promise = window.Promise || require('bluebird');

class HistoryManager {
  constructor(canvas) {
    this.history = [];
    this.historyIndex = -1;
    this.canvas = canvas;
  }

  pushNewFabricObject(fabricObject) {
    if(this.historyIndex > -1) {
      this.history.splice(this.historyIndex + 1);
    }

    this.history.push({
      type: 'add',
      data: JSON.stringify(fabricObject)
    });
    this.historyIndex++;
  }

  pushPropertyChange(property, objectIndex, oldValue, newValue) {
    if(this.historyIndex > -1) {
      this.history.splice(this.historyIndex + 1);
    }

    this.history.push({
      type: 'change',
      data: { property, objectIndex, oldValue, newValue }
    });
    this.historyIndex++;
  }

  undo() {
    if(this.historyIndex === -1) {
      return Promise.resolve(this);
    }

    return new Promise((resolve, reject) => {
      // get the current change to be applied
      var currentChange = this.history[this.historyIndex];
      if(currentChange.type === 'add') {
        var oldItemIndex = this.canvas.getObjects().map(JSON.stringify).indexOf(currentChange.data);
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
      }

      // move history backwards
      this.historyIndex--;
      resolve(this);
    });
  }

  redo() {
    if(this.historyIndex >= this.history.length - 1) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      var newChange = this.history[this.historyIndex + 1];
      if(newChange.type === 'add') {
        var parsed = JSON.parse(newChange.data);
        fabric.util.enlivenObjects([parsed], results => {
          if(results.length < 1) {
            reject(this);
            return;
          }
          this.canvas.add(results[0]);
          this.historyIndex++;
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
        this.historyIndex++;
        resolve(this);
      }
    });
  }
}

module.exports = HistoryManager;
