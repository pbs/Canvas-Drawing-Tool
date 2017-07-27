var MaskedShapeRenderer = require('./masked-shape-renderer');

/**
 * A `fabric.Path` subclass that mixes in masking for its rendering, which
 * allows it to have "erasing powers"
 */
const MaskedPath = fabric.util.createClass(fabric.Path, MaskedShapeRenderer);
module.exports = MaskedPath;
