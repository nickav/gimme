var assert = require('assert');
var nodemock = require('nodemock');
var fs = require('fs')

var env = require('./helpers/env');
var helpers = require('./helpers/index');
var merge = require('../lib/merge');

describe('merge should', function() {
  it('3-way merge correctly', function() {
    var base = 'a\nb\nc\nd';
    var theirs = 'hi\nb\nc\nd';
    var mine = 'a\nb\nc\nhello';

    var expected  = 'hi\nb\nc\nhello';
    var result = merge.threeWay(mine, base, theirs);
    assert.equal(result, expected);
  });

  it('favor mine over theirs on conflicts', function() {
    var base = 'a\nb\nc\nd';
    var theirs = 'hi\ntheirs\nc\nd';
    var mine = 'hello\nmine\nc\nhello';

    var expected = mine;
    var result = merge.threeWay(mine, base, theirs);
    assert.equal(result, expected);
  });
});

