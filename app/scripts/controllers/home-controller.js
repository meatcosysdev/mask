(function () {
    angular.module('MeatCoApp')
        .controller('HomeController', homeController);

    homeController.$inject = ['$http', 'CONFIG'];

    // Declarations
    function homeController($http, CONFIG) {
        var vm = this;

        vm.getIp = getIp;
        vm.app_version = CONFIG.app_version;
        vm.current_date = moment().format('DD-MMM-YYYY HH:mm');

        // INIT
        //vm.getIp();

        function getIp() {
            $http.get('http://ipv4.myexternalip.com/json').then(function (result) {
                if (result && result.data) vm.client_ip = result.data.ip;
            }, function (e) {
                alert("error");
            });
        }
    }
})();