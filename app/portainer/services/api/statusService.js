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
          deferred.reject({ msg: '无法检索应用程序状态', err: err });
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
          deferred.reject({ msg: '无法检索应用程序版本信息', err: err });
        });

      return deferred.promise;
    };

    return service;
  },
]);
