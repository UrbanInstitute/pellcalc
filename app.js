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
    start: 30000
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
    equation:   'agi/fam + agi'
  },
  {
    name:       'Three-Factor Pell',
    parameters: ['agi', 'fam', 'chi'],
    equation:   'agi + fam + chi'
  },
  {
    name:       'Hamilton Project',
    parameters: ['agi', 'chi'],
    equation:   'agi + chi'
  },
  {
    name:       'Modified Pell on a Postcard',
    parameters: ['agi', 'chi'],
    equation:   'agi + chi'
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
        c.values = c.parameters.reduce(function(o, p) {
          o[p] = parameters[p].start;
          return o;
        }, {});
        return c;
      })
    });

    $scope.compute = function(calc) {
      with(calc.values) {
        return eval(calc.equation);
      }
    };

  }]);
