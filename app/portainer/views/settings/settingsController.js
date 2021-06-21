angular.module('portainer.app').controller('SettingsController', [
  '$scope',
  '$state',
  'Notifications',
  'SettingsService',
  'StateManager',
  function ($scope, $state, Notifications, SettingsService, StateManager) {
    $scope.state = {
      actionInProgress: false,
      availableEdgeAgentCheckinOptions: [
        {
          key: '5 秒',
          value: 5,
        },
        {
          key: '10 秒',
          value: 10,
        },
        {
          key: '30 秒',
          value: 30,
        },
      ],
    };

    $scope.formValues = {
      customLogo: false,
      externalTemplates: false,
      restrictBindMounts: false,
      restrictPrivilegedMode: false,
      labelName: '',
      labelValue: '',
      enableHostManagementFeatures: false,
      enableVolumeBrowser: false,
      enableEdgeComputeFeatures: false,
      allowStackManagementForRegularUsers: false,
      restrictHostNamespaceForRegularUsers: false,
      allowDeviceMappingForRegularUsers: false,
      disableContainerCapabilitiesForRegularUsers: false,
    };

    $scope.isContainerEditDisabled = function isContainerEditDisabled() {
      const {
        restrictBindMounts,
        restrictHostNamespaceForRegularUsers,
        restrictPrivilegedMode,
        disableDeviceMappingForRegularUsers,
        disableContainerCapabilitiesForRegularUsers,
      } = this.formValues;
      return (
        restrictBindMounts || restrictHostNamespaceForRegularUsers || restrictPrivilegedMode || disableDeviceMappingForRegularUsers || disableContainerCapabilitiesForRegularUsers
      );
    };

    $scope.removeFilteredContainerLabel = function (index) {
      var settings = $scope.settings;
      settings.BlackListedLabels.splice(index, 1);

      updateSettings(settings);
    };

    $scope.addFilteredContainerLabel = function () {
      var settings = $scope.settings;
      var label = {
        name: $scope.formValues.labelName,
        value: $scope.formValues.labelValue,
      };
      settings.BlackListedLabels.push(label);

      updateSettings(settings);
    };

    $scope.saveApplicationSettings = function () {
      var settings = $scope.settings;

      if (!$scope.formValues.customLogo) {
        settings.LogoURL = '';
      }

      if (!$scope.formValues.externalTemplates) {
        settings.TemplatesURL = '';
      }

      settings.AllowBindMountsForRegularUsers = !$scope.formValues.restrictBindMounts;
      settings.AllowPrivilegedModeForRegularUsers = !$scope.formValues.restrictPrivilegedMode;
      settings.AllowVolumeBrowserForRegularUsers = $scope.formValues.enableVolumeBrowser;
      settings.EnableHostManagementFeatures = $scope.formValues.enableHostManagementFeatures;
      settings.EnableEdgeComputeFeatures = $scope.formValues.enableEdgeComputeFeatures;
      settings.AllowStackManagementForRegularUsers = !$scope.formValues.disableStackManagementForRegularUsers;
      settings.AllowHostNamespaceForRegularUsers = !$scope.formValues.restrictHostNamespaceForRegularUsers;
      settings.AllowDeviceMappingForRegularUsers = !$scope.formValues.disableDeviceMappingForRegularUsers;
      settings.AllowContainerCapabilitiesForRegularUsers = !$scope.formValues.disableContainerCapabilitiesForRegularUsers;

      $scope.state.actionInProgress = true;
      updateSettings(settings);
    };

    function updateSettings(settings) {
      SettingsService.update(settings)
        .then(function success() {
          Notifications.success('设置更新');
          StateManager.updateLogo(settings.LogoURL);
          StateManager.updateSnapshotInterval(settings.SnapshotInterval);
          StateManager.updateEnableHostManagementFeatures(settings.EnableHostManagementFeatures);
          StateManager.updateEnableVolumeBrowserForNonAdminUsers(settings.AllowVolumeBrowserForRegularUsers);
          StateManager.updateEnableEdgeComputeFeatures(settings.EnableEdgeComputeFeatures);
          StateManager.updateAllowStackManagementForRegularUsers(settings.AllowStackManagementForRegularUsers);
          StateManager.updateAllowHostNamespaceForRegularUsers(settings.AllowHostNamespaceForRegularUsers);
          StateManager.updateAllowDeviceMappingForRegularUsers(settings.AllowDeviceMappingForRegularUsers);
          StateManager.updateAllowPrivilegedModeForRegularUsers(settings.AllowPrivilegedModeForRegularUsers);
          StateManager.updateAllowBindMountsForRegularUsers(settings.AllowBindMountsForRegularUsers);
          StateManager.updateAllowContainerCapabilitiesForRegularUsers(settings.AllowContainerCapabilitiesForRegularUsers);
          $state.reload();
        })
        .catch(function error(err) {
          Notifications.error('失败', err, '无法更新设置');
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    }

    function initView() {
      SettingsService.settings()
        .then(function success(data) {
          var settings = data;
          $scope.settings = settings;
          if (settings.LogoURL !== '') {
            $scope.formValues.customLogo = true;
          }
          if (settings.TemplatesURL !== '') {
            $scope.formValues.externalTemplates = true;
          }
          $scope.formValues.restrictBindMounts = !settings.AllowBindMountsForRegularUsers;
          $scope.formValues.restrictPrivilegedMode = !settings.AllowPrivilegedModeForRegularUsers;
          $scope.formValues.enableVolumeBrowser = settings.AllowVolumeBrowserForRegularUsers;
          $scope.formValues.enableHostManagementFeatures = settings.EnableHostManagementFeatures;
          $scope.formValues.enableEdgeComputeFeatures = settings.EnableEdgeComputeFeatures;
          $scope.formValues.disableStackManagementForRegularUsers = !settings.AllowStackManagementForRegularUsers;
          $scope.formValues.restrictHostNamespaceForRegularUsers = !settings.AllowHostNamespaceForRegularUsers;
          $scope.formValues.disableDeviceMappingForRegularUsers = !settings.AllowDeviceMappingForRegularUsers;
          $scope.formValues.disableContainerCapabilitiesForRegularUsers = !settings.AllowContainerCapabilitiesForRegularUsers;
        })
        .catch(function error(err) {
          Notifications.error('失败', err, '无法检索应用程序设置');
        });
    }

    initView();
  },
]);
