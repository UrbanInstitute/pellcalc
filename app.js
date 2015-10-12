;(function() {


function capGrant(grant, cap, roundLower, roundUpper) {
  cap = cap || 5775;
  roundLower = roundLower || 288;
  roundUpper = roundUpper || 577;

  grant = grant < roundUpper                   ?
          (grant < roundLower ? 0 : roundUpper) :
          grant;

  return Math.max(0, Math.min(grant, cap));
}


var povertyGuideLines = {
  // family members, poverty line
  1: 11670,
  2: 15730,
  3: 19790,
  4: 23850,
  5: 27910,
  6: 31970,
  7: 36030,
  8: 40090
};


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
          n = (Math.min(v.fam, 8) | 0),
          pov = povertyGuideLines[n],
          grant = 5775 - (v.agi - 1.5*pov)*( 5775 / (2.5*pov - 1.5*pov));

      return capGrant(grant);
    }
  },
  {
    name:       'Three-Factor Pell',
    parameters: ['agi', 'fam', 'chi'],
    compute: function() {
      var v = this.values,
          n = (Math.min(v.fam + v.chi, 8) | 0),
          pov = povertyGuideLines[n],
          grant = 5775 - (v.agi - 1.5*pov)*( 5775 / (2.5*pov - 1.5*pov));

      return capGrant(grant);
    }
  },
  {
    name:       'Hamilton Project',
    parameters: ['agi', 'chi'],
    compute: function() {
      var v = this.values,
          n = (Math.min(v.fam + v.chi, 8) | 0),
          pov = povertyGuideLines[n],
          grant = 5775 - (v.agi - 1.5*pov)*( 5775 / (2.5*pov - 1.5*pov));

      return capGrant(grant);
    }
  },
  {
    name:       'Modified Pell on a Postcard',
    parameters: ['agi', 'chi'],
    compute: function() {
      var grant,
          v = this.values,
          grantValues = [
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
          ];

      grantValues.forEach(function(row) {
        if (row.agi <= v.agi) {
          grant = row.grant;
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
