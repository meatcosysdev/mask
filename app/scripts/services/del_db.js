(function () {
    'use strict';

    angular.module('MeatCoApp')
        .factory('pouchdb', pouchdb);

    pouchdb.$inject = ['CONFIG'];

    // Declarations
    function pouchdb(CONFIG) {
        var remoteDatabase = CONFIG.remove_db_server;
        var db = new PouchDB(CONFIG.db_name);

        db.sync(remoteDatabase, {live: true, retry: true});

        return db;
    };
})();