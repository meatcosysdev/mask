(function () {
    'use strict';

    angular.module('MeatCoApp')
        .constant('CONFIG', {
            db_name: 'meat_co',
            remove_db_server: 'http://localhost:5984/meat_co', //'http://192.168.1.201:5984/meat_co'
            print_server_url: 'http://localhost:4000/print', //'http://192.168.1.201:3000/print',
            websocket_server: 'ws://astra3224.startdedicated.com:9292', //'ws://192.168.1.201:9292'
            sell_offal_vat: 10,
            meatboard_levy: 0.6,
            minimum_buy_price: 1000,
            sb_reload_interval: 2000,
            app_version: '1.2.0'
        });
})();