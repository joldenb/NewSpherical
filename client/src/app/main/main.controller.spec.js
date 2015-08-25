(function() {
  'use strict';

  describe('controllers', function(){

    beforeEach(module('sphericalFrontEnd'));

    it('should define more than 5 awesome things', inject(function($controller) {
      var vm = $controller('MainController');

      expect(angular.isArray(vm.awesomeThings)).toBeTruthy();
      expect(vm.awesomeThings.length > 5).toBeTruthy();
    }));

    it('should connect to the Rails API', inject(function($controller, $http) {

      var vm = $controller('MainController');

      expect(vm.r88rResults).toBeDefined();

    }));
  });
})();
