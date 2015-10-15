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
 * All the possible parameters in the different calculators...
 */
var parameters = {
  dep: {
    name: 'Student Dependency Status',
    toggle: ['Dependent', 'Independent'],
    start: 'Dependent'
  },
  fam: {
    name: 'Family Size',
    // bounds of input, can be function of other parameter's value...
    range: function() { return [1, 100]; },
    // start value of param
    start: 3,
    // pattern to validate input with
    pattern: /^\d+/
  },
  agi: {
    name: 'Adjusted Gross Income',
    range: function() { return [0, 1000000]; },
    start: 30000,
    step: 1000,
    pattern: /^\$?(\d+|\d{1,3}(,\d{3})*)(\.[0-9]{1,2})?$/
  },
  col: {
    name: 'Number of Other Family in College',
    range: function() { return [0, Math.min(this.values.fam, 100)]; },
    start: 2,
    pattern: /^\d+/
  },
  chi: {
    name: 'Number of children (other than student)',
    range: function() { return [0, Math.min(this.values.fam, 100)]; },
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
      var v     = parameters.values, // stores the current values of the parameters
          n     = Math.min(v.fam, 6) | 0, // coerce to int with bitwise OR
          pov   = povertyGuideLines[n];

      return bound(capGrant(pell(v.agi, pov)));
    }
  },
  {
    name:       'Three-Factor Pell',
    parameters: ['agi', 'fam', 'col'],
    compute: function() {
      var v     = parameters.values,
          n     = Math.min(v.fam + v.col, 7) | 0,
          pov   = povertyGuideLines[n];

      return bound(capGrant(pell(v.agi, pov)));
    }
  },
  {
    name:       'Hamilton Project',
    parameters: ['agi', 'fam', 'dep'],
    compute: function() {
      var v     = parameters.values,
          n     = Math.min(v.fam, 6) | 0,
          pov   = povertyGuideLines[n],
          grant = capGrant(pell(v.agi, pov));

      if (v.dep === 'Independent') {
        switch(true) {
          case v.agi < pov*2: return 5775;
          case v.agi > pov*2 && v.agi < pov*2.5: return 2888;
          case v.agi > pov*2.5: return 0;
        }
      }

      return bound(grant);
    }
  },
  {
    name:       'Base Pell on a Postcard',
    parameters: ['agi', 'chi'],
    compute: pellOnAPostCardFormula('base')
  },
  {
    name:       'Modified Pell on a Postcard',
    parameters: ['agi', 'chi'],
    compute: pellOnAPostCardFormula('modified')
  }
];



/*
 * base Pell Grant Formula
 */
function pell(agi, pov) {
  return 5775 - (agi - 1.5*pov)*( 5775 / (2.5*pov - 1.5*pov))
}


/**
 * Pell on a postcard formula
 */
function pellOnAPostCardFormula(type) {
  /*
   * Pell on a Postcard lookup table by AGI
   */
  var pellOnAPostcardLookup = {
    base: [
      { agi: 14999, grant: 5775 },
      { agi: 19999, grant: 5250 },
      { agi: 24999, grant: 4700 },
      { agi: 29999, grant: 4250 },
      { agi: 34999, grant: 3450 },
      { agi: 39999, grant: 2300 },
      { agi: 44999, grant: 1250 },
      { agi: 49999, grant: 1050 },
      { agi: 74999, grant: 800 },
      { agi: 99999, grant: 600 }
    ],
    modified: [
      { agi: 19999,	grant: 5775 },
      { agi: 22499,	grant: 5250 },
      { agi: 24999,	grant: 4700 },
      { agi: 27499,	grant: 4150 },
      { agi: 29999,	grant: 3400 },
      { agi: 32499,	grant: 2850 },
      { agi: 34999,	grant: 2100 },
      { agi: 39999,	grant: 1550 },
      { agi: 44999,	grant: 1050 },
      { agi: 59999,	grant: 600 },
      { agi: 74999,	grant: 250 }
    ]
  };

  return function() {
    var table = pellOnAPostcardLookup[type],
        grant = table[0].grant,
        v     = parameters.values;

    // find nearest agi for grant
    angular.forEach(table, function(row) {
      if (row.agi <= v.agi) {
        grant = row.grant;
      }
    });

    // add 250 per child up to 1000 extra
    grant = capGrant(grant + Math.min(v.chi*250, 1000), 300, 600);

    return bound(grant);
  };
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
  .module('app', ['ui.bootstrap'])
  .controller('main', ['$scope', function($scope) {

    /*
     * Add the parameters and calculators to the $scope,
     * so we can reference them in the angular directives
     * within index.html
     */

    $scope.parameters = parameters;

    $scope.calculators = calculators.map(function(calculator) {

      calculator.id = calculator
        .name
        .toLowerCase()
        .replace(/\W+/g,'-');

      // create values object with starting value
      parameters.values = Object
        .keys(parameters)
        .reduce(function(o, p) {
          o[p] = parameters[p].start;
          return o;
        }, {});

      return calculator;
    });

  }]);


})();
