import _ from 'lodash-es';
import { UserViewModel } from '../../models/user';
import { TeamMembershipModel } from '../../models/teamMembership';

angular.module('portainer.app').factory('UserService', [
  '$q',
  'Users',
  'UserHelper',
  'TeamService',
  'TeamMembershipService',
  function UserServiceFactory($q, Users, UserHelper, TeamService, TeamMembershipService) {
    'use strict';
    var service = {};

    service.users = function (includeAdministrators) {
      var deferred = $q.defer();

      Users.query({})
        .$promise.then(function success(data) {
          var users = data.map(function (user) {
            return new UserViewModel(user);
          });
          if (!includeAdministrators) {
            users = UserHelper.filterNonAdministratorUsers(users);
          }
          deferred.resolve(users);
        })
        .catch(function error(err) {
          deferred.reject({ msg: '无法检索用户', err: err });
        });

      return deferred.promise;
    };

    service.user = function (id) {
      var deferred = $q.defer();

      Users.get({ id: id })
        .$promise.then(function success(data) {
          var user = new UserViewModel(data);
          deferred.resolve(user);
        })
        .catch(function error(err) {
          deferred.reject({ msg: '无法检索用户详细信息', err: err });
        });

      return deferred.promise;
    };

    service.createUser = function (username, password, role, teamIds) {
      var deferred = $q.defer();

      var payload = {
        username: username,
        password: password,
        role: role,
      };

      Users.create({}, payload)
        .$promise.then(function success(data) {
          var userId = data.Id;
          var teamMembershipQueries = [];
          angular.forEach(teamIds, function (teamId) {
            teamMembershipQueries.push(TeamMembershipService.createMembership(userId, teamId, 2));
          });
          $q.all(teamMembershipQueries).then(function success() {
            deferred.resolve();
          });
        })
        .catch(function error(err) {
          deferred.reject({ msg: '无法创建用户', err: err });
        });

      return deferred.promise;
    };

    service.deleteUser = function (id) {
      return Users.remove({ id: id }).$promise;
    };

    service.updateUser = function (id, password, role) {
      var query = {
        password: password,
        role: role,
      };
      return Users.update({ id: id }, query).$promise;
    };

    service.updateUserPassword = function (id, currentPassword, newPassword) {
      var payload = {
        Password: currentPassword,
        NewPassword: newPassword,
      };

      return Users.updatePassword({ id: id }, payload).$promise;
    };

    service.userMemberships = function (id) {
      var deferred = $q.defer();

      Users.queryMemberships({ id: id })
        .$promise.then(function success(data) {
          var memberships = data.map(function (item) {
            return new TeamMembershipModel(item);
          });
          deferred.resolve(memberships);
        })
        .catch(function error(err) {
          deferred.reject({ msg: '无法检索用户成员资格', err: err });
        });

      return deferred.promise;
    };

    service.userLeadingTeams = function (id) {
      var deferred = $q.defer();

      $q.all({
        teams: TeamService.teams(),
        memberships: service.userMemberships(id),
      })
        .then(function success(data) {
          var memberships = data.memberships;
          var teams = data.teams.filter(function (team) {
            var membership = _.find(memberships, { TeamId: team.Id });
            if (membership && membership.Role === 1) {
              return team;
            }
          });
          deferred.resolve(teams);
        })
        .catch(function error(err) {
          deferred.reject({ msg: '无法检索用户团队', err: err });
        });

      return deferred.promise;
    };

    service.initAdministrator = function (username, password) {
      return Users.initAdminUser({ Username: username, Password: password }).$promise;
    };

    service.administratorExists = function () {
      var deferred = $q.defer();

      Users.checkAdminUser({})
        .$promise.then(function success() {
          deferred.resolve(true);
        })
        .catch(function error(err) {
          if (err.status === 404) {
            deferred.resolve(false);
          }
          deferred.reject({ msg: '无法验证管理员帐户是否存在', err: err });
        });

      return deferred.promise;
    };

    return service;
  },
]);
