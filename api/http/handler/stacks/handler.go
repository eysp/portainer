package stacks

import (
	"errors"
	"net/http"
	"sync"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle stack operations.
type Handler struct {
	stackCreationMutex *sync.Mutex
	stackDeletionMutex *sync.Mutex
	requestBouncer     *security.RequestBouncer
	authDisabled       bool

	*mux.Router
	FileService            portainer.FileService
	GitService             portainer.GitService
	StackService           portainer.StackService
	EndpointService        portainer.EndpointService
	ResourceControlService portainer.ResourceControlService
	RegistryService        portainer.RegistryService
	DockerHubService       portainer.DockerHubService
	SwarmStackManager      portainer.SwarmStackManager
	ComposeStackManager    portainer.ComposeStackManager
	SettingsService        portainer.SettingsService
	UserService            portainer.UserService
	ExtensionService       portainer.ExtensionService
}

// NewHandler creates a handler to manage stack operations.
func NewHandler(bouncer *security.RequestBouncer, authDisabled bool) *Handler {
	h := &Handler{
		Router:             mux.NewRouter(),
		authDisabled:       authDisabled,
		stackCreationMutex: &sync.Mutex{},
		stackDeletionMutex: &sync.Mutex{},
		requestBouncer:     bouncer,
	}
	h.Handle("/stacks",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackCreate))).Methods(http.MethodPost)
	h.Handle("/stacks",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackList))).Methods(http.MethodGet)
	h.Handle("/stacks/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackInspect))).Methods(http.MethodGet)
	h.Handle("/stacks/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackDelete))).Methods(http.MethodDelete)
	h.Handle("/stacks/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackUpdate))).Methods(http.MethodPut)
	h.Handle("/stacks/{id}/file",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackFile))).Methods(http.MethodGet)
	h.Handle("/stacks/{id}/migrate",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackMigrate))).Methods(http.MethodPost)
	return h
}

func (handler *Handler) userCanAccessStack(securityContext *security.RestrictedRequestContext, endpointID portainer.EndpointID, resourceControl *portainer.ResourceControl) (bool, error) {
	if securityContext.IsAdmin || handler.authDisabled {
		return true, nil
	}

	userTeamIDs := make([]portainer.TeamID, 0)
	for _, membership := range securityContext.UserMemberships {
		userTeamIDs = append(userTeamIDs, membership.TeamID)
	}

	if resourceControl != nil && portainer.UserCanAccessResource(securityContext.UserID, userTeamIDs, resourceControl) {
		return true, nil
	}

	_, err := handler.ExtensionService.Extension(portainer.RBACExtension)
	if err == portainer.ErrObjectNotFound {
		return false, nil
	} else if err != nil && err != portainer.ErrObjectNotFound {
		return false, err
	}

	user, err := handler.UserService.User(securityContext.UserID)
	if err != nil {
		return false, err
	}

	_, ok := user.EndpointAuthorizations[endpointID][portainer.EndpointResourcesAccess]
	if ok {
		return true, nil
	}
	return false, nil
}

func (handler *Handler) userCanCreateStack(securityContext *security.RestrictedRequestContext, endpointID portainer.EndpointID) (bool, error) {
	if securityContext.IsAdmin || handler.authDisabled {
		return true, nil
	}

	_, err := handler.ExtensionService.Extension(portainer.RBACExtension)
	if err == portainer.ErrObjectNotFound {
		return false, nil
	} else if err != nil && err != portainer.ErrObjectNotFound {
		return false, err
	}

	user, err := handler.UserService.User(securityContext.UserID)
	if err != nil {
		return false, err
	}

	_, ok := user.EndpointAuthorizations[endpointID][portainer.EndpointResourcesAccess]
	if ok {
		return true, nil
	}
	return false, nil
}

func (handler *Handler) userIsAdminOrEndpointAdmin(user *portainer.User, endpointID portainer.EndpointID) (bool, error) {
	isAdmin := user.Role == portainer.AdministratorRole

	rbacExtension, err := handler.ExtensionService.Extension(portainer.RBACExtension)
	if err != nil && err != portainer.ErrObjectNotFound {
		return false, errors.New("Unable to verify if RBAC extension is loaded")
	}

	endpointResourceAccess := false
	_, ok := user.EndpointAuthorizations[portainer.EndpointID(endpointID)][portainer.EndpointResourcesAccess]
	if ok {
		endpointResourceAccess = true
	}

	if rbacExtension != nil {
		if isAdmin || endpointResourceAccess {
			return true, nil
		}
	} else {
		if isAdmin {
			return true, nil
		}
	}

	return false, nil
}
