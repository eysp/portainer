angular.module('portainer.app').factory('SupportService', [
  '$q',
  'Support',
  function SupportServiceFactory($q, Support) {
    'use strict';
    var service = {};

    service.supportProducts = function () {
      var deferred = $q.defer();

      Support.get()
        .$promise.then(function success(data) {
          deferred.resolve(data);
        })
        .catch(function error(err) {
          deferred.reject({ msg: '�޷�����֧��ѡ��', err: err });
        });

      return deferred.promise;
    };

    return service;
  },
]);
