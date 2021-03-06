angular.module('portainer.docker').controller('TaskController', [
  '$scope',
  '$transition$',
  'TaskService',
  'ServiceService',
  'Notifications',
  function ($scope, $transition$, TaskService, ServiceService, Notifications) {
    function initView() {
      TaskService.task($transition$.params().id)
        .then(function success(data) {
          var task = data;
          $scope.task = task;
          return ServiceService.service(task.ServiceId);
        })
        .then(function success(data) {
          var service = data;
          $scope.service = service;
        })
        .catch(function error(err) {
          Notifications.error('失败', err, '无法检索任务详细信息');
        });
    }

    initView();
  },
]);
