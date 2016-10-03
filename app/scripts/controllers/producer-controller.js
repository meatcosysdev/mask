(function () {
    angular.module('MeatCoApp')
        .controller('ProducerController', producerController);

    producerController.$inject = ['$state', 'buyCattleService'];

    // Declarations
    function producerController($state, buyCattleService) {
        var vm = this;

        vm.producer = {};

        // Methods
        vm.goto = goto;
        vm.print = print;
        vm.exit = exit;
        vm.changeMemberShipOption = changeMemberShipOption;
        vm.findProducer = findProducer;
        vm.updateProducer = updateProducer;
        vm.clearForm = clearForm;

        // IMPLEMENTATION
        function clearForm() {
            vm.producer = {};
        }

        function updateProducer() {
            buyCattleService.update_producer(vm.producer).then(function () {
                toastr.success("Producer was successfully saved!");
            });
        }

        function changeMemberShipOption() {
            if (!vm.producer.want_membership) {
                delete vm.producer.telephone_no;
                delete vm.producer.physical_address;
                delete vm.producer.postal_address;
                delete vm.producer.email_address;
            }
        }

        function findProducer() {
            vm.producer.include_docs = true;
            buyCattleService.find_producer(vm.producer)
                .then(function (result) {
                    if (result.length > 0) {
                        vm.producer = angular.copy(result[0].doc);
                    } else {
                        delete vm.producer['_id'];
                        delete vm.producer['_rev'];
                        toastr.info("No results found!");
                    }
                });
        }

        function goto(state) {
            $state.go(state);
        }

        function exit() {
            $state.go('home');
        }
    }
})();