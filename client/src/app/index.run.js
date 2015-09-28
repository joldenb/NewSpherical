(function() {
  'use strict';

  angular
    .module('sphericalFrontEnd')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log) {

    $log.debug('runBlock end');
  }

})();
