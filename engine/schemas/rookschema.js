var schema = require('./moveschema.js');
var vector = require("../vector.js");

module.exports = [
    schema.create(vector.create(0, 1), 8, true, true),
    schema.create(vector.create(0, -1), 8, true, true),
    schema.create(vector.create(1, 0), 8, true, true),
    schema.create(vector.create(-1, 0), 8, true, true),
]