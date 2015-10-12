;(function() {


/*
 * family members, poverty line
 * http://aspe.hhs.gov/2014-poverty-guidelines#tresholds
 */
var povertyGuideLines = {
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
 * Pell on a Postcard lookup table by AGI
 */
var pellOnAPostcard = [
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


/*
 * All the possible parameters in the different calculators...
 */
var parameters = {
  fam: {
    name: 'Family Size',
    // bounds of input, can be function of other parameter's value...
    range: function(values) { return [1, 100]; },
    // start value of param
    start: 3,
    // pattern to validate input with
    pattern: /^\d+/
  },
  agi: {
    name: 'Adjusted Gross Income',
    range: function(values) { return [0, 1000000]; },
    start: 30000,
    step: 1000,
    pattern: /^\$?(\d+|\d{1,3}(,\d{3})*)(\.[0-9]{1,2})?$/
  },
  col: {
    name: 'Number of Other Family in College',
    range: function(values) { return [0, Math.min(values.fam, 100)]; },
    start: 2,
    pattern: /^\d+/
  },
  chi: {
    name: 'Number of children (other than student)',
    range: function(values) { return [0, Math.min(values.fam, 100)]; },
    start: 2,
    pattern: /^\d+/
  }
};



/*
 * All the different calculators with their equations...
 */
var calculators = [
  {
    name:       'Two-Factor Pell',
    parameters: ['agi', 'fam'],
    compute: function() {
      var v     = this.values, // stores the current values of the parameters
          n     = Math.min(v.fam, 8) | 0, // coerce to int with bitwise OR
          pov   = povertyGuideLines[n];

      return bound(capGrant(pell(v.agi, pov)));
    }
  },
  {
    name:       'Three-Factor Pell',
    parameters: ['agi', 'fam', 'chi'],
    compute: function() {
      var v     = this.values,
          n     = Math.min(v.fam + v.chi, 8) | 0,
          pov   = povertyGuideLines[n];

      return bound(capGrant(pell(v.agi, pov)));
    }
  },
  {
    name:       'Hamilton Project',
    parameters: ['agi', 'fam'],
    compute: function() {
      var v     = this.values,
          n     = Math.min(v.fam, 8) | 0,
          pov   = povertyGuideLines[n],
          grant = capGrant(pell(v.agi, pov));

      // AGI less than 200% of poverty, can recieve max of up to bound
      if (v.agi < pov*2) {
        return bound(grant);
      }

      return bound(grant, 2888);
    }
  },
  {
    name:       'Modified Pell on a Postcard',
    parameters: ['agi', 'chi'],
    compute: function() {
      var grant = pellOnAPostcard[0].grant,
          v     = this.values;

      // find nearest agi for grant
      angular.forEach(pellOnAPostcard, function(row) {
        if (row.agi <= v.agi) {
          grant = row.grant;
        }
      });

      // add 250 per child up to 1000 extra
      grant = capGrant(grant + Math.min(v.chi*250, 1000), 300, 600);

      return bound(grant);
    }
  }
];


/*
 * base Pell Grant Formula
 */
function pell(agi, pov) {
  return 5775 - (agi - 1.5*pov)*( 5775 / (2.5*pov - 1.5*pov))
}


/*
 * lower pell grant rounding schema
 */
function capGrant(grant, roundLower, roundUpper) {
  roundLower = roundLower || 288;
  roundUpper = roundUpper || 577;

  grant = grant < roundUpper                    ?
          (grant < roundLower ? 0 : roundUpper) :
          grant;

  return grant;
}


/*
 * bound a value by [lower, upper]
 */
function bound(val, upper, lower) {
  lower = lower || 0;
  upper = upper || 5775;
  return Math.max(lower, Math.min(upper, val))
}



/*
 * create the angular app!
 */
angular
  .module('app', [])
  .controller('main', ['$scope', function($scope) {

    /*
     * Add the parameters and calculators to the $scope,
     * so we can reference them in the angular directives
     * within index.html
     */

    $scope.parameters  = parameters;

    $scope.calculators = calculators.map(function(calculator) {

      calculator.id = calculator
        .name
        .toLowerCase()
        .replace(/\W+/g,'-');

      // create values object with starting value
      calculator.values = calculator
        .parameters
        .reduce(function(o, p) {
          o[p] = parameters[p].start;
          return o;
        }, {});

      return calculator;
    });

  }]);


})();
