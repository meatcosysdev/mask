(function () {
    angular.module('MeatCoApp')
        .controller('StunboxController', stunboxController);

    stunboxController.$inject = ['$state', '$rootScope', 'animalService', 'scannerService'];

    // Declarations
    function stunboxController($state, $rootScope, animalService, scannerService) {
        var vm = this;

        vm.stunbox_animals = [];
        vm.new_animal = $rootScope.new_animal || {body_counter: $rootScope.body_counter};

        // Methods
        vm.getStunboxAnimals = getStunboxAnimals;
        vm.addAnimal = addAnimal;
        vm.selectAnimalForEdit = selectAnimalForEdit;
        vm.focusTo = focusTo;
        vm.init = init;

        // INIT
        vm.init();

        // IMPLEMENTATION
        function getStunboxAnimals() {
            animalService.get_stunbox_animals({include_docs: true})
                .then(function (animals) {
                    vm.stunbox_animals = animals.rows.map(function (a) {
                        return {
                            "body_counter": a.doc.daily_counter,
                            "weight": a.doc.live_mass,
                            "rfid": a.doc.fmid,
                            "_id": a.doc._id,
                        }
                    });
                    $rootScope.body_counter = animals.total_rows + 1;
                });
        };

        function selectAnimalForEdit(animal) {
            vm.stunbox_animals.forEach(function (a) {
                a.isSelected = false;
            });
            animal.isSelected = true;
            vm.new_animal = $rootScope.new_animal = animal;
        }

        function addAnimal() {
            animalService.save_stunbox_animal(vm.new_animal)
                .then(function () {
                    delete $rootScope.new_animal;
                    $state.go('stunbox');
                });
        }

        function focusTo(field) {
            if (field == 'weight') {
                vm.edit_field = {
                    name: 'weight',
                    regex: "^\\d{0,3}(\\.\\d{0,2}){0,1}$"
                }
            } else {
                vm.edit_field = {
                    name: 'rfid',
                    regex: "^[a-zA-Z0-9_]{0,8}$"
                }
            }
        }

        function init() {
            scannerService.get_stunbox_scanner_inputs().then(function (response) {
                vm.new_animal.rfid = response.visualTag;
                vm.new_animal.weight = response.displayMass;
                vm.focusTo('rfid');
            });
        }
    }
})();