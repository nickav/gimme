var assert = require('assert');
var nodemock = require('nodemock');
var fs = require('fs')

var env = require('./helpers/env');
var helpers = require('./helpers/index');
var merge = require('../lib/merge');

describe('merge should', function() {
  it('3-way merge correctly', function(done) {
    var base = 'a\nb\nc\nd';
    var theirs = 'hi\nb\nc\nd';
    var mine = 'a\nb\nc\nhello';

    var expected  = 'hi\nb\nc\nhello';
    var result = merge.threeWayString(mine, base, theirs);
    assert.equal(expected, result);
  });
});

