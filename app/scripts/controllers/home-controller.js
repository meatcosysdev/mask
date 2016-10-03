(function () {
    angular.module('MeatCoApp')
        .controller('HomeController', homeController);

    homeController.$inject = ['$http'];

    // Declarations
    function homeController($http) {
        var vm = this;

        vm.getIp = getIp;

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