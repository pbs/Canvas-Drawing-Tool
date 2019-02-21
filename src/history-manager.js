/**
 * Helper class for managing a state stack of changes made to the canvas. Stores deltas to save
 * space
 */
class HistoryManager {
  /**
   * Creates a new history manager, with a canvas to monitor
   * @param {fabric.Canvas} canvas The canvas to monitor
   */
  constructor(canvas) {
    this.history = [];
    this.historyIndex = -1;
    this.canvas = canvas;
    this.objectIdCounter = 1;
  }

  /**
   * Tracks a new object addition to the canvas, assigning it an id for later lookups
   * @param {fabric.Object} fabricObject A fabric object (Path, Image, etc.)
   * @returns {void}
   */
  pushNewFabricObject(fabricObject) {
    // if there is any history after this point in time, nuke it.
    if(this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
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

  /**
   * Tracks a single property change to an object
   * @param {String} property The property name that changed (scaleX, top, angle, etc.)
   * @param {Number} objectIndex The index in the display list that denotes which object changed
   * @param {Number|String} oldValue The previous value of the property
   * @param {Number|String} newValue The new value of the property
   * @returns {void}
   */
  pushPropertyChange(property, objectIndex, oldValue, newValue) {
    this.pushPropertyChanges([{ property, objectIndex, oldValue, newValue }]);
  }

  /**
   * Batch tracks a set of changes so that they can be grouped together
   *
   * @param {Array} changes An array of changes, with a property, objectIndex, oldValue, and
   *                        newValue keys
   * @returns {void}
   */
  pushPropertyChanges(changes) {
    // blow away any changes after this one
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

  /**
   * Reverses the last change that was made to the canvas. If an object was added, the object is
   * removed. If a property was changed, that change is reversed
   *
   * @return {Promise} A promise the resolves when all changes are finished applying
   */
  undo() {
    // bail early if there's nothing left to undo
    if(this.historyIndex === -1) {
      return Promise.resolve(this);
    }

    // un-applies a single change in the history array (add or a delete)
    const processChange = currentChange => {
      return new Promise((resolve, reject) => {
        if(currentChange.type === 'add') {
          // if the change is an add, find the item and remove it
          var oldItemIndex = this.canvas.getObjects()
            .map(JSON.stringify)
            .indexOf(currentChange.data);

          if(oldItemIndex > -1) {
            this.canvas.remove(this.canvas.getObjects()[oldItemIndex]);
          }
        } else if(currentChange.type === 'change') {
          // if it's a property change, find the object and set the property
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

    // process every change in this changeset, then back history up AND re-render
    var promises = this.history[this.historyIndex].map(processChange);
    return Promise.all(promises).then(() => {
      this.historyIndex--;
      this.canvas.renderAll();
      return;
    });
  }

  /**
   * Reapplies a change that was previously undid, including re-adding an object that was removed
   * and setting properties back to their next value they were set to
   *
   * @return {Promise} A promise that resolves when all changes are finished applying
   */
  redo() {
    // bail early if we can't redo anything
    if(this.historyIndex >= this.history.length - 1) {
      return Promise.resolve();
    }

    // function to redo a single history event
    const processChange = newChange => {
      return new Promise((resolve, reject) => {
        if(newChange.type === 'add') {
          // if it's an add, re-hydrate the fabric instance and add back to the canvas
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
          // if it's a property change, set the property to the new value
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

    // process each changeset, then move history forward and re-render
    var promises = this.history[this.historyIndex + 1].map(processChange);
    return Promise.all(promises).then(() => {
      this.historyIndex++;
      this.canvas.renderAll();
      return this;
    });
  }
}

module.exports = HistoryManager;
