var diff = require('./vendor/diff');
var util = require('util');

module.exports = {
  /**
   * 3-Way Merge on Strings.
   * @param strategy - the merge strategy ('a', 'o', or 'b'). Defaults to 'a'
   * @param delim    - the String to split the Strings on. Defaults to '\n'
   */
  threeWayString: function(mine, base, theirs, strategy, delim) {
    strategy = strategy || 'a';
    delim = delim || '\n';
    var results = diff.diff3_merge(mine.split(delim), base.split(delim), theirs.split(delim));

    var merged = '';
    for (var i=0, n=results.length; i<n; i++) {
      var result = results[i];
      if (result.ok) merged += result.ok.join(delim); 
      else merged += result.conflict[strategy].join(delim);
      if (i < n - 1) merged += delim;
    }

    return merged;
  },
};

/*
[ { conflict:
     { a: [ 'a', 'mine', [length]: 2 ],
       aIndex: 0,
       o: [ 'a', 'b', [length]: 2 ],
       oIndex: 0,
       b: [ 'hi', 'theirs', [length]: 2 ],
       bIndex: 0 } },
  { ok: [ 'c', 'hello', [length]: 2 ] },
  [length]: 2 ]
// testing
var base = 'a\nb\nc\nd';
var theirs = 'hi\ntheirs\nc\nd';
var mine = 'a\nmine\nc\nhello';
console.log(module.exports.threeWayString(mine, base, theirs))
*/
