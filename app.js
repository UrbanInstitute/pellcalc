;(function() {


/*
 * All the possible parameters in the different calculators...
 */
var parameters = {
  fam: {
    name: 'Family Size',
    range: [1, 100],
    start: 3
  },
  agi: {
    name: 'Adjusted Gross Income',
    range: [0, 1000000],
    start: 30000,
    step: 1000
  },
  col: {
    name: 'Number of Other Family in College',
    range: [0, 100],
    start: 2
  },
  chi: {
    name: 'Number of children (other than student)',
    range: [0, 100],
    start: 2
  }
}



/*
 * All the different calculators with their equations...
 */
var calculators = [
  {
    name:       'Two-Factor Pell',
    parameters: ['agi', 'fam'],
    compute: function() {
      var v = this.values,
          grant = 0;

      for (var param in v) {
        grant += v[param];
      }

      return grant;
    }
  },
  {
    name:       'Three-Factor Pell',
    parameters: ['agi', 'fam', 'chi'],
    compute: function() {
      var v = this.values,
          grant = 0;

      for (var param in v) {
        grant += v[param];
      }

      return grant;
    }
  },
  {
    name:       'Hamilton Project',
    parameters: ['agi', 'chi'],
    compute: function() {
      var v = this.values,
          grant = 0;

      for (var param in v) {
        grant += v[param];
      }

      return grant;
    }
  },
  {
    name:       'Modified Pell on a Postcard',
    parameters: ['agi', 'chi'],
    compute: function() {
      var v = this.values,
          lookUp = [
            { agi: 14999,    grant:	5550 },
            { agi: 19999,    grant:	5000 },
            { agi: 24999,    grant:	4500 },
            { agi: 29999,    grant:	4050 },
            { agi: 34999,    grant:	3250 },
            { agi: 39999,    grant:	2150 },
            { agi: 44999,    grant:	1100 },
            { agi: 49999,    grant:	800 },
            { agi: 74999,    grant:	600 },
            { agi: 99999,    grant:	400 },
            { agi: 100000,   grant:	0 }
          ],
          grant = lookUp[lookUp.length - 1];

      $.each(lookUp, function(index, row) {
        // find first row with applicable agi and break...
        if (row.agi >= v.agi) {
          grant = row.grant;
          return false;
        }
      });

      // add 250 per child up to 1000 extra
      return grant + Math.min(v.chi*250, 1000);
    }
  }
];



/*
 * create the angular app!
 */
angular
  .module('app', [])
  .controller('main', ['$scope', function($scope) {

    angular.extend($scope, {
      parameters : parameters,
      calculators : calculators.map(function(c) {
        c.id = c.name.toLowerCase().replace(/[^a-z]/g, '_');
        c.values = c.parameters.reduce(function(o, p) {
          o[p] = parameters[p].start;
          return o;
        }, {});
        return c;
      })
    });

  }]);

})();
