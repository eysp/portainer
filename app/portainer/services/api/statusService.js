import { StatusVersionViewModel, StatusViewModel } from '../../models/status';

angular.module('portainer.app').factory('StatusService', [
  '$q',
  'Status',
  function StatusServiceFactory($q, Status) {
    'use strict';
    var service = {};

    service.status = function () {
      var deferred = $q.defer();

      Status.get()
        .$promise.then(function success(data) {
          var status = new StatusViewModel(data);
          deferred.resolve(status);
        })
        .catch(function error(err) {
          deferred.reject({ msg: '�޷�����Ӧ�ó���״̬', err: err });
        });

      return deferred.promise;
    };

    service.version = function () {
      var deferred = $q.defer();

      Status.version()
        .$promise.then(function success(data) {
          var status = new StatusVersionViewModel(data);
          deferred.resolve(status);
        })
        .catch(function error(err) {
          deferred.reject({ msg: '�޷�����Ӧ�ó���汾��Ϣ', err: err });
        });

      return deferred.promise;
    };

    return service;
  },
]);
