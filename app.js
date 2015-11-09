var renderCalc = function(){
/**
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


/**
 * The selected values for the different parameters
 */
var values = {};


/**
 * All the possible parameters in the different calculators...
 */
var parameters = {
  dep: {
    name: 'Student dependency status',
    toggle: ['Dependent', 'Independent'],
    start: 'Dependent'
  },
  fam: {
    name: 'Family size',
    max: 100,
    min: 1,
    start: 3,
    pattern: /^\d+/
  },
  agi: {
    name: 'AGI',
    max: 1000000,
    min: 0,
    start: 30000,
    step: 1000,
    pattern: /^\$?(\d+|\d{1,3}(,\d{3})*)(\.[0-9]{1,2})?$/
  },
  col: {
    name: 'Number of other family members in college',
    min: 0,
    get max() { return Math.min(values.fam - 1, 100); },
    start: 2,
    pattern: /^\d+/
  },
  chi: {
    name: 'Number of children (other than student)',
    min: 0,
    get max() { return Math.min(values.fam - 1, 100); },
    start: 2,
    pattern: /^\d+/
  }
};



/**
 * All the different calculators with their equations...
 */
var calculators = [
  {
    name:       'Original Pell on a postcard',
    desc: 'Based on AGI with extra money for additional children in the family. Includes funds from both Pell and education tax credits.',
    parameters: ['agi', 'chi'],
    compute: pellOnAPostCardFormula('original')
  },
  {
    name:       'Modified Pell on a postcard',
    desc: 'Follows the original Pell-on-a-postcard model but removes education tax credits.',
    parameters: ['agi', 'chi'],
    compute: pellOnAPostCardFormula('modified')
  },
  {
    name:       'Two-factor Pell',
    // desc: "Based on AGI relative to the <a href='http://aspe.hhs.gov/2014-poverty-guidelines'>federal poverty level</a>, which varies with family size.",
    trust: "Based on AGI relative to the <a href='http://aspe.hhs.gov/2014-poverty-guidelines'>federal poverty level</a>, which varies with family size.",
    parameters: ['agi', 'fam'],
    compute: function() {
      var n     = Math.min(values.fam, 6) | 0, // coerce to int with bitwise OR
          pov   = povertyGuideLines[n];

      return bound(capGrant(pell(values.agi, pov)));
    }
  },
  {
    name:       'Three-factor Pell',
    desc: 'Follows the two-factor Pell model but adjusts family size to account for other family members in college.',
    parameters: ['agi', 'fam', 'col'],
    compute: function() {
      var n     = Math.min(values.fam + values.col, 7) | 0,
          pov   = povertyGuideLines[n];

      return bound(capGrant(pell(values.agi, pov)));
    }
  },
  {
    name:       'Hamilton Project',
    desc: 'Follows the two-factor Pell model for dependent students. Independent students receive full, half, or no Pell based on AGI.',
    parameters: ['agi', 'fam', 'dep'],
    compute: function() {
      var n     = Math.min(values.fam, 6) | 0,
          pov   = povertyGuideLines[n],
          grant = capGrant(pell(values.agi, pov));

      if (values.dep === 'Independent') {
        switch(true) {
          case values.agi < pov*2: return 5775;
          case values.agi > pov*2 && values.agi < pov*2.5: return 2888;
          case values.agi > pov*2.5: return 0;
        }
      }

      return bound(grant);
    }
  }
  
];



/**
 * original Pell Grant Formula
 */
function pell(agi, pov) {
  return 5775 - (agi - 1.5*pov)*( 5775 / (2.5*pov - 1.5*pov))
}


/**
 * Pell on a postcard formula
 */
function pellOnAPostCardFormula(type) {
  /**
   * Pell on a Postcard lookup table by AGI
   */
  var pellOnAPostcardLookup = {
    original: [
      { agi: 15000, grant: 5775 },
      { agi: 20000, grant: 5250 },
      { agi: 25000, grant: 4700 },
      { agi: 30000, grant: 4250 },
      { agi: 35000, grant: 3450 },
      { agi: 40000, grant: 2300 },
      { agi: 45000, grant: 1250 },
      { agi: 50000, grant: 1050 },
      { agi: 75000, grant: 800 },
      { agi: 100000, grant: 600 }
    ],
    modified: [
      { agi: 20000,	grant: 5775 },
      { agi: 22500,	grant: 5250 },
      { agi: 25000,	grant: 4700 },
      { agi: 27500,	grant: 4150 },
      { agi: 30000,	grant: 3400 },
      { agi: 32500,	grant: 2850 },
      { agi: 35000,	grant: 2100 },
      { agi: 40000,	grant: 1550 },
      { agi: 45000,	grant: 1050 },
      { agi: 60000,	grant: 600 },
      { agi: 75000,	grant: 250 }
    ]
  };

  return function() {
    var table = pellOnAPostcardLookup[type],
        index = table.length,
        grant = 0,
        row;

    // find nearest agi for grant
    while (index && values.agi < (row = table[--index]).agi) {
      grant = row.grant;
    }

    // return grant + Math.min(1000, values.chi*250);
        // console.log(grant, values)
    if(grant != 0){
      return grant + Math.min(1000, values.chi*250);
    }else{ return 0}
  };
}


/**
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


/**
 * bound a value by [lower, upper]
 */
function bound(val, upper, lower) {
  lower = lower || 0;
  upper = upper || 5775;
  return Math.max(lower, Math.min(upper, val))
}



/**
 * create the angular app!
 */
angular
  .module('app', ['ui.bootstrap'])
  .controller('main', ['$scope', '$sce', function($scope, $sce) {
    // create values object with starting value
    Object
      .keys(parameters)
      .forEach(function(p) { values[p] = parameters[p].start; });

    /**
     * Add the parameters and calculators to the $scope,
     * so we can reference them in the angular directives
     * within index.html
     */
    $scope.values = values;
    $scope.parameters = parameters;
    $scope.calculators = calculators.map(function(calculator) {
      calculator.id = calculator
        .name
        .toLowerCase()
        .replace(/\W+/g,'-');

      return calculator;
    });
    $scope.calculators.map(function(c){
     if(typeof(c.trust) != "undefined"){
        $scope.trusted = $sce.trustAsHtml(c.trust);
     }
    })
  }])
  .directive('focusMe', ['$timeout', function($timeout) {
    return {
      scope: {
        formInvalid: '='
      },
      link: function($scope, $element) {

        $scope.$watch('formInvalid', function() {
          $element
            .find('.param-value')
            .on('click', function() {
              $timeout(function() {
                $element.find('.range-parameter').focus();
              });
            });
        });

      }
    }
  }])

}

renderCalc();
window.setTimeout(function(){
var pymChild = new pym.Child({ renderCallback: renderCalc });
}, 20);
