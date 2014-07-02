// angular.module is a global place for creating, registering and retrieving Angular modules
// 'defqon' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array or 'requires'
// 'defqon.controllers' is found in controllers.js
angular.module('defqon', ['ionic', 'ngRoute', 'ngAnimate', 'lbServices', 'defqon.services', 'defqon.controllers', 'leaflet-directive', 'primus'])

.config(function ($compileProvider){
  // Needed for routing to work
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
})

.config(function (primusProvider) {
  primusProvider
  // Define Primus endpoint.
  .setEndpoint('http://s01.chase.sillevis.net:20002')
  // Define Primus options.
  .setOptions({
    reconnect: {
      minDelay: 100,
      maxDelay: 60000,
      retries: 100
    }
  })
  // Define default multiplex option for resources.
  .setDefaultMultiplex(false);
})

.config(function($routeProvider, $locationProvider, $httpProvider) {

  // Set up the initial routes that our app will respond to.
  // These are then tied up to our nav router which animates and
  // updates a navigation bar
  $routeProvider.when('/home', {
    templateUrl: 'templates/app.html',
    controller: 'AppCtrl'
  });
  $routeProvider.when('/home/:userId/:userName', {
    templateUrl: 'templates/app.html',
    controller: 'AppCtrl'
  });

  $routeProvider.when('/invite', {
    templateUrl: 'templates/invite.html',
    controller: 'InviteCtrl'
  });

  $routeProvider.when('/register', {
    templateUrl: 'templates/register.html',
    controller: 'RegisterCtrl'
  });

  $routeProvider.when('/login', {
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl'
  });

  // if none of the above routes are met, use this fallback
  // which executes the 'AppCtrl' controller (controllers.js)
  $routeProvider.otherwise({
    redirectTo: '/home'
  });

  // Intercept 401 responses and redirect to login screen
  $httpProvider.interceptors.push(function($q, $location, AppAuth) {
    return {
      responseError: function(rejection) {
        console.log('intercepted rejection of ', rejection.config.url, rejection.status);
        if (rejection.status == 401) {
          AppAuth.currentUser = null;
          // save the current location so that login can redirect back
          $location.nextAfterLogin = $location.path();
          $location.path('/login');
        }
        return $q.reject(rejection);
      }
    };
  });
})

.run(function($rootScope, $location, AppAuth) {
  $rootScope.$on("$routeChangeStart", function(event, next, current) {
    console.log('AppAuth.currentUser', AppAuth.currentUser);
    console.log('$location.path()', $location.path());
  });
});


var app = {
  initialize: function() {
    this.bindEvents();
  },
  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, true);
  },

  onDeviceReady: function() {
    angular.element(document).ready(function() {
      angular.bootstrap(document);
    });
  },
};