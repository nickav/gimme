var diff = require('./vendor/diff');

module.exports = {
  /**
   * 3-Way Merge on Strings. Favors mine when possible
   * @param delim - the String to split the Strings on. Defaults to '\n'
   */
  threeWay: function(mine, base, theirs, delim) {
    delim = delim || '\n';
    var results = diff.diff3_merge(mine.split(delim), base.split(delim), theirs.split(delim));

    //console.log(require('util').inspect(results, true, 4));

    var merged = '';
    for (var i=0, n=results.length; i<n; i++) {
      var result = results[i];
      if (result.ok) merged += result.ok.join(delim);
      else {
        // resolve the conflict, favoring a
        var conflict = result.conflict;
        for (var j=0, m=conflict.a.length; j<m; j++) {
          if (conflict.a[j] == conflict.o[j]) {
            merged += conflict.b[j];
          }
          else {
            merged += conflict.a[j];
          }
          if (j < m - 1) merged += delim;
        }
      }
      if (i < n - 1) merged += delim;
    }

    return merged;
  },
};
