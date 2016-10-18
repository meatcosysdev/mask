(function () {
    'use strict';

    angular.module('MeatCoApp.Directives', []);

    /**
     * @ngdoc overview
     * @name MeatCoApp
     * @description
     * # MeatCoApp
     *
     * Main module of the application.
     */
    angular
        .module('MeatCoApp', [
            'ui.router',
            'ngTouch',
            'barcode',
            'ngWebSocket',
            'MeatCoApp.Directives'
        ])
        .config(configFunction)
        .run(runOptions);

    configFunction.$inject = ['$stateProvider', '$urlRouterProvider'];

    runOptions.$inject = ['$rootScope', '$templateCache'];

    function configFunction($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/home');

        $stateProvider
            .state('home', {
                url: "/home",
                views: {
                    '': {
                        templateUrl: 'views/home.html',
                        controller: 'HomeController as vm'
                    }
                }
            })

            // ALL INVOICES
            .state('invoices', {
                url: "/invoices",
                views: {
                    '': {
                        templateUrl: 'views/invoices/index.html',
                        controller: 'DispatchNotesController as vm'
                    }
                }
            })

            // STUNBOX
            .state('stunbox', {
                url: "/stunbox",
                views: {
                    '': {
                        templateUrl: 'views/stunbox/main.html'
                    },
                    'detail@stunbox': {
                        templateUrl: 'views/stunbox/list.html',
                        controller: 'StunboxController as vm'
                    }
                }
            })
            .state('stunbox.animal', {
                views: {
                    '': {},
                    'detail@stunbox': {
                        templateUrl: 'views/stunbox/add-animal.html',
                        controller: 'StunboxController as vm'
                    }
                }
            })

            .state('stunbox.search', {
                url: "/search",

                views: {
                    '': {},
                    'detail@stunbox': {
                        templateUrl: 'views/stunbox/search.html',
                        controller: 'StunboxController as vm'
                    }
                }
            })

            // SLAUGHTER
            .state('slaughter', {
                url: "/slaughter",
                views: {
                    '': {
                        templateUrl: 'views/slaughter/main.html'
                    },
                    'detail@slaughter': {
                        templateUrl: 'views/slaughter/list.html',
                        controller: 'SlaughterController as vm'
                    }
                }
            })
            .state('slaughter.health', {
                views: {
                    '': {},
                    'detail@slaughter': {
                        templateUrl: 'views/slaughter/health.html',
                        controller: 'SlaughterController as vm'
                    }
                }
            })
            .state('slaughter.fat', {
                views: {
                    '': {},
                    'detail@slaughter': {
                        templateUrl: 'views/slaughter/fat.html',
                        controller: 'SlaughterController as vm'
                    }
                }
            })
            .state('slaughter.weight', {
                views: {
                    '': {},
                    'detail@slaughter': {
                        templateUrl: 'views/slaughter/weight.html',
                        controller: 'SlaughterController as vm'
                    }
                }
            })

            .state('slaughter.search', {
                url: '/search',
                views: {
                    '': {},
                    'detail@slaughter': {
                        templateUrl: 'views/slaughter/search.html',
                        controller: 'SlaughterController as vm'
                    }
                }
            })

            // BUY
            .state('buy', {
                url: "/buy",
                views: {
                    '': {
                        templateUrl: 'views/buy/main.html'
                    },
                    'detail@buy': {
                        templateUrl: 'views/buy/producer-details.html',
                        controller: 'BuyCattleController as vm',
                        resolve: {
                            data: ['$stateParams', function ($stateParams) {
                                return $stateParams.data;
                            }]
                        }
                    }
                }
            })
            .state('buy.animal', {
                views: {
                    '': {},
                    'detail@buy': {
                        templateUrl: 'views/buy/animal-details.html',
                        controller: 'BuyCattleController as vm',
                        resolve: {
                            data: ['$stateParams', function ($stateParams) {
                                return $stateParams.data;
                            }]
                        }
                    }
                },
                params: {'data': {value: null}}
            })
            .state('buy.grading', {
                views: {
                    '': {},
                    'detail@buy': {
                        templateUrl: 'views/buy/animal-teeth.html',
                        controller: 'BuyCattleController as vm',
                        resolve: {
                            data: ['$stateParams', function ($stateParams) {
                                return $stateParams.data;
                            }]
                        }
                    }
                },
                params: {'data': {value: null}}

            })
            .state('buy.fat', {
                views: {
                    '': {},
                    'detail@buy': {
                        templateUrl: 'views/buy/animal-fat.html',
                        controller: 'BuyCattleController as vm',
                        resolve: {
                            data: ['$stateParams', function ($stateParams) {
                                return $stateParams.data;
                            }]
                        }
                    }
                },
                params: {'data': {value: null}}
            })
            .state('buy.price', {
                views: {
                    '': {},
                    'detail@buy': {
                        templateUrl: 'views/buy/price.html',
                        controller: 'BuyCattleController as vm',
                        resolve: {
                            data: ['$stateParams', function ($stateParams) {
                                return $stateParams.data;
                            }]
                        }
                    }
                },
                params: {'data': {value: null}},
            })
            .state('buy.pay', {
                views: {
                    '': {},
                    'detail@buy': {
                        templateUrl: 'views/buy/pay.html',
                        controller: 'BuyCattleController as vm',
                        resolve: {
                            data: ['$stateParams', function ($stateParams) {
                                return $stateParams.data;
                            }]
                        }
                    }
                },
                params: {'data': {value: null}},
            })

            .state('grading', {
                url: '/api/grading/:tag',
                views: {
                    '': {
                        template: '{{vm.data | json}}',
                        controller: 'BuyCattleController as vm',
                        resolve: {
                            data: ['$stateParams', 'buyCattleService', function ($stateParams, buyCattleService) {
                                return buyCattleService.get_animal_grading($stateParams.tag);
                            }]
                        }
                    }
                }
            })

            // TRANSFER
            .state('transfer', {
                url: "/transfer",
                views: {
                    '': {
                        templateUrl: 'views/transfer/main.html'
                    },
                    'detail@transfer': {
                        templateUrl: 'views/transfer/truck.html',
                        controller: 'TransferController as vm',
                        resolve: {
                            data: ['$stateParams', function ($stateParams) {
                                return $stateParams.data;
                            }]
                        }
                    }
                }
            })
            .state('transfer.barcode', {
                views: {
                    '': {},
                    'detail@transfer': {
                        templateUrl: 'views/transfer/barcode.html',
                        controller: 'TransferController as vm',
                        resolve: {
                            data: ['$stateParams', function ($stateParams) {
                                return $stateParams.data;
                            }]
                        }
                    }
                },
                params: {'data': {value: null}}
            })
            .state('transfer.list', {
                views: {
                    '': {},
                    'detail@transfer': {
                        templateUrl: 'views/transfer/list.html',
                        controller: 'TransferController as vm',
                        resolve: {
                            data: ['$stateParams', function ($stateParams) {
                                return $stateParams.data;
                            }]
                        }
                    }
                },
                params: {'data': {value: null}}
            })
            .state('transfer.dispatch', {
                views: {
                    '': {},
                    'detail@transfer': {
                        templateUrl: 'views/transfer/dispatch.html',
                        controller: 'TransferController as vm',
                        resolve: {
                            data: ['$stateParams', function ($stateParams) {
                                return $stateParams.data;
                            }]
                        }
                    }
                },
                params: {'data': {value: null}}
            })

            // SELL
            .state('sell', {
                url: "/sell",
                views: {
                    '': {
                        templateUrl: 'views/sell/main.html'
                    },
                    'detail@sell': {
                        templateUrl: 'views/sell/list.html',
                        controller: 'SellController as vm',
                        resolve: {
                            data: ['$stateParams', function ($stateParams) {
                                return $stateParams.data;
                            }]
                        }
                    }
                }
            })
            .state('sell.tax', {
                views: {
                    '': {},
                    'detail@sell': {
                        templateUrl: 'views/sell/tax.html',
                        controller: 'SellController as vm',
                        resolve: {
                            data: ['$stateParams', function ($stateParams) {
                                return $stateParams.data;
                            }]
                        }
                    }
                },
                params: {'data': {value: null}}
            })

            // ADMIN
            .state('admin', {
                url: '/admin',
                views: {
                    '': {
                        templateUrl: 'views/admin/main.html'
                    },
                    'detail@admin': {
                        templateUrl: 'views/admin/details.html'
                    }
                }
            })
            .state('admin.producers', {
                views: {
                    '': {},
                    'detail@admin': {
                        templateUrl: 'views/producer/details.html',
                        controller: 'ProducerController as vm'
                    }
                },
            })
        ;
    }

    function runOptions($rootScope, $templateCache) {
        $rootScope.$on('$viewContentLoaded', function () {
            $templateCache.removeAll();
        });
    }
})();
