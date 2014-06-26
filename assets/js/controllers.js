angular.module('defqon.controllers', ['defqon.services'])

.controller('AppCtrl', function($scope, User, Location, $location, AppAuth, $routeParams, primus, $timeout) {
  AppAuth.ensureHasCurrentUser(User);
  $scope.currentUser = AppAuth.currentUser;

  $scope.options = [
    {text: 'Logout', action: function() {
      User.logout(function() {
        $scope.currentUser =
        AppAuth.currentUser = null;
        $location.path('/');
      });
    }}
  ];

  $scope.toggleLeft = function() {
    $scope.sideMenuController.toggleLeft();
  };

  $scope.markers = {};
  $scope.paths = {};

  if(typeof $scope.currentUser.$promise == 'undefined') {
    window.location.reload();
  }
  else {
    $scope.currentUser.$promise.then(function() {
      // Get other users to show in sidebar
      $scope.users = {};
      User.find({filter: {limit: 100, order: 'created ASC'}}, function(users) {
        $scope.sidebarUsers = users;
        users.forEach(function(user) {
          if(!(user.id in $scope.users))
            $scope.users[(user.id)] = user.name;
        });
      });

      // Function used to send current location on change
      $scope.sendLocation = function(position) {
        primus.send('location', {
          userId: $scope.currentUser.id,
          x: position.coords.latitude,
          y: position.coords.longitude,
          created: new Date(),
          updated: new Date()
        });
      };

      if($scope.watchID)
        navigator.geolocation.clearWatch($scope.watchID);
      $scope.watchID = null;
      if (navigator.geolocation) {
        $scope.watchID = navigator.geolocation.watchPosition(function watchPosition(position) {
          $scope.sendLocation(position);
        }, function watchError(error) {
          console.log(error);
        }, { timeout: 200000, enableHighAccuracy: true });
      }
      else {
        console.log('no navigator.geolocation');
      }

      // Create the map
      $scope.mapUserId = $scope.currentUser.id || 0;
      $scope.mapUserName = $scope.currentUser.name || '';

      if('userId' in $routeParams)
        $scope.mapUserId = $routeParams.userId;
      if('userName' in $routeParams)
        $scope.mapUserName = $routeParams.userName;

      // Functions used to generate unique colours per id
      var stringToColour = function(str) {
        var i;
        // str to hash
        for (i = 0, hash = 0; i < str.length; hash = str.charCodeAt(i++) + ((hash << 5) - hash));

        // int/hash to hex
        for (i = 0, colour = "#"; i < 3; colour += ("00" + ((hash >> i++ * 8) & 0xFF).toString(16)).slice(-2));

        return colour;
      };

      $scope.tPaths = [];
      $scope.getLocation = function() {
        console.log('Update the map');

        // receive incoming map msgs
        $scope.locations = [];
        primus.$on('map', function (data) {
          if(data instanceof Array) {
            $scope.usedUsers = [];
            data.forEach(function(location) {
              $scope.focus = false;
              if('userId' in $routeParams && $scope.mapUserId != location.userId)
                return true;

              if(location.userId in $scope.usedUsers) {
                $scope.tPaths.push({
                  lat: parseFloat(location.x), lng: parseFloat(location.y)
                });
                $scope.paths[(location.userId)].latlngs = $scope.tPaths;
              }
              else {
                if('userId' in $routeParams) {
                  $scope.focus = true;
                }
                $scope.markers[(location.userId)] = {
                  lat: parseFloat(location.x),
                  lng: parseFloat(location.y),
                  message: $scope.users[(location.userId)],
                  focus: $scope.focus,
                  draggable: false,
                  icon: {
                    type: 'div',
                    iconSize: [1, 1],
                    popupAnchor:  [0, 0],
                    html: '<div class="leaflet-div-icon-content" style="background-color: ' + stringToColour(location.userId) + ';"></div>'
                  }
                };
                $scope.paths[(location.userId)] = {
                  color: stringToColour(location.userId),
                  weight: 1,
                  latlngs: [{lat: 0, lng: 0}]
                };
                $scope.usedUsers.push(location.userId);
              }
            });
          }
          else {
            $scope.userData = data;
            $scope.focus = false;
            if('userId' in $routeParams) {
              $scope.focus = true;

              // When we're looking directly at one user, ignore the other updates coming in
              if($scope.mapUserId != $scope.userData.userId)
                return true;
            }
            $scope.markers[($scope.userData.userId)] = {
              lat: parseFloat($scope.userData.x),
              lng: parseFloat($scope.userData.y),
              message: $scope.users[($scope.userData.userId)],
              focus: $scope.focus,
              draggable: false,
              icon: {
                type: 'div',
                iconSize: [1, 1],
                popupAnchor:  [0, 0],
                html: '<div class="leaflet-div-icon-content" style="background-color: ' + stringToColour($scope.userData.userId) + ';"></div>'
              }
            };
          }
        });
      };
      $scope.getLocation();
      primus.send('update');
    });
  }

  angular.extend($scope, {
    center: {
      lat: 52.4361702,
      lng: 5.7484867,
      zoom: 15
    },
    defaults: {
      scrollWheelZoom: false,
      tileLayerOptions: {
          opacity: 0.9,
          detectRetina: true,
          reuseTiles: true,
      }
    },
    geojson: {
      data: {
        "type":"FeatureCollection","features":[
        {
          "type": "Feature",
          "id": "RED",
          "properties": {
              "name":"Red"
          },
          "geometry": {
            "type":"Polygon",
            "coordinates":[
              [
                [5.75921,52.44025],
                [5.75672,52.4392],
                [5.75537,52.4403],
                [5.75538,52.44031],
                [5.75796,52.44136]
              ]
            ]
          }
        },
        {
          "type": "Feature",
          "id": "BLUE",
          "properties": {
              "name":"Blue"
          },
          "geometry": {
            "type":"Polygon",
            "coordinates":[
              [
                [5.75073,52.43912],
                [5.74949,52.4386],
                [5.7485,52.4394],
                [5.74851,52.4394],
                [5.74983,52.43992]
              ]
            ]
          }
        },
        {
          "type": "Feature",
          "id": "UV",
          "properties": {
              "name":"UV"
          },
          "geometry": {
            "type":"Polygon",
            "coordinates":[
              [
                [5.75277,52.43992],
                [5.75153,52.43941],
                [5.75054,52.4402],
                [5.75055,52.4402],
                [5.75187,52.44072]
              ]
            ]
          }
        },
        {
          "type": "Feature",
          "id": "GREEN",
          "properties": {
              "name":"Green"
          },
          "geometry": {
            "type":"Polygon",
            "coordinates":[
              [
                [5.75358,52.44105],
                [5.75234,52.44053],
                [5.75135,52.44133],
                [5.75136,52.44133],
                [5.75268,52.44185]
              ]
            ]
          }
        },
        {
          "type": "Feature",
          "id": "PURPLE",
          "properties": {
              "name":"Purple"
          },
          "geometry": {
            "type":"Polygon",
            "coordinates":[
              [
                [5.75884,52.44147],
                [5.7576,52.44095],
                [5.75661,52.44175],
                [5.75662,52.44175],
                [5.75794,52.44226]
              ]
            ]
          }
        },
        {
          "type": "Feature",
          "id": "INDIGO",
          "properties": {
              "name":"Indigo"
          },
          "geometry": {
            "type":"Polygon",
            "coordinates":[
              [
                [5.75511,52.43961],
                [5.75386,52.43909],
                [5.75288,52.43989],
                [5.75289,52.43989],
                [5.75421,52.44041]
              ]
            ]
          }
        },
        {
          "type": "Feature",
          "id": "WHITE",
          "properties": {
              "name":"White"
          },
          "geometry": {
            "type":"Polygon",
            "coordinates":[
              [
                [5.75457,52.43935],
                [5.75333,52.43883],
                [5.75234,52.43963],
                [5.75235,52.43963],
                [5.75367,52.44015]
              ]
            ]
          }
        },
        {
          "type": "Feature",
          "id": "MAGENTA",
          "properties": {
              "name":"Magenta"
          },
          "geometry": {
            "type":"Polygon",
            "coordinates":[
              [
                [5.75328,52.43886],
                [5.75204,52.43835],
                [5.75105,52.43915],
                [5.75106,52.43914],
                [5.75238,52.43966]
              ]
            ]
          }
        },
        {
          "type": "Feature",
          "id": "ORANGE",
          "properties": {
              "name":"Orange"
          },
          "geometry": {
            "type":"Polygon",
            "coordinates":[
              [
                [5.752,52.43838],
                [5.75075,52.43786],
                [5.74977,52.43866],
                [5.74978,52.43866],
                [5.7511,52.43918]
              ]
            ]
          }
        },
        {
          "type": "Feature",
          "id": "BROWN",
          "properties": {
              "name":"Brown"
          },
          "geometry": {
            "type":"Polygon",
            "coordinates":[
              [
                [5.75569,52.4408],
                [5.75444,52.44028],
                [5.75346,52.44108],
                [5.75347,52.44108],
                [5.75479,52.4416]
              ]
            ]
          }
        },
        {
          "type": "Feature",
          "id": "BLACK",
          "properties": {
              "name":"Black"
          },
          "geometry": {
            "type":"Polygon",
            "coordinates":[
              [
                [5.75401,52.438],
                [5.75277,52.43748],
                [5.75178,52.43828],
                [5.75179,52.43828],
                [5.75311,52.4388]
              ]
            ]
          }
        },
        {
          "type": "Feature",
          "id": "YELLOW",
          "properties": {
              "name":"Yellow"
          },
          "geometry": {
            "type":"Polygon",
            "coordinates":[
              [
                [5.75738,52.43753],
                [5.75614,52.43701],
                [5.75515,52.43781],
                [5.75516,52.43781],
                [5.75648,52.43833]
              ]
            ]
          }
        },
        {
          "type": "Feature",
          "id": "GOLD",
          "properties": {
              "name":"Gold"
          },
          "geometry": {
            "type":"Polygon",
            "coordinates":[
              [
                [5.75637,52.43842],
                [5.75519,52.43786],
                [5.75459,52.43833],
                [5.7546,52.43833],
                [5.75592,52.43885]
              ]
            ]
          }
        },
        {
          "type": "Feature",
          "id": "SILVER",
          "properties": {
              "name":"Silver"
          },
          "geometry": {
            "type":"Polygon",
            "coordinates":[
              [
                [5.75472,52.43845],
                [5.7541,52.43807],
                [5.75328,52.43891],
                [5.7533,52.43891],
                [5.75393,52.43916]
              ]
            ]
          }
        }]
      },
      style: function(feature) {
        switch (feature.properties.name) {
          case 'Red':
            return {
              "color": "#bd001d",
              "opacity": 1,
              "fillColor": "#bd001d",
              "fillOpacity": 0.8
            };
          case 'Blue':
            return {
              "color": "#5795ae",
              "opacity": 1,
              "fillColor": "#5795ae",
              "fillOpacity": 0.8
            };
          case 'UV':
            return {
              "color": "#594b97",
              "opacity": 1,
              "fillColor": "#594b97",
              "fillOpacity": 0.8
            };
          case 'Green':
            return {
              "color": "#95ae2d",
              "opacity": 1,
              "fillColor": "#95ae2d",
              "fillOpacity": 0.8
            };
          case 'Purple':
            return {
              "color": "#641b64",
              "opacity": 1,
              "fillColor": "#641b64",
              "fillOpacity": 0.8
            };
          case 'Indigo':
            return {
              "color": "#262a6c",
              "opacity": 1,
              "fillColor": "#262a6c",
              "fillOpacity": 0.8
            };
          case 'White':
            return {
              "color": "#ffffff",
              "opacity": 1,
              "fillColor": "#ffffff",
              "fillOpacity": 0.8
            };
          case 'Magenta':
            return {
              "color": "#e00b63",
              "opacity": 1,
              "fillColor": "#e00b63",
              "fillOpacity": 0.8
            };
          case 'Orange':
            return {
              "color": "#de3e13",
              "opacity": 1,
              "fillColor": "#de3e13",
              "fillOpacity": 0.8
            };
          case 'Brown':
            return {
              "color": "#542c22",
              "opacity": 1,
              "fillColor": "#542c22",
              "fillOpacity": 0.8
            };
          case 'Black':
            return {
              "color": "#000000",
              "opacity": 1,
              "fillColor": "#000000",
              "fillOpacity": 0.8
            };
          case 'Yellow':
            return {
              "color": "#fab827",
              "opacity": 1,
              "fillColor": "#fab827",
              "fillOpacity": 0.8
            };
          case 'Silver':
            return {
              "color": "#c3cacd",
              "opacity": 1,
              "fillColor": "#c3cacd",
              "fillOpacity": 0.8
            };
          case 'Gold':
            return {
              "color": "#83673e",
              "opacity": 1,
              "fillColor": "#83673e",
              "fillOpacity": 0.8
            };
        }
      }
    },
    markers: $scope.markers,
    paths: $scope.paths
  });
})

.controller('InviteCtrl', function($scope, User, Location, $location, AppAuth, $routeParams, primus) {
  AppAuth.ensureHasCurrentUser(User);
  $scope.currentUser = AppAuth.currentUser;

  $scope.options = [
    {text: 'Logout', action: function() {
      User.logout(function() {
        $scope.currentUser =
        AppAuth.currentUser = null;
        $location.path('/');
      });
    }}
  ];

  $scope.toggleLeft = function() {
    $scope.sideMenuController.toggleLeft();
  };

  $scope.invite = function() {
    $scope.inviteResult = function() {
      // Send an e-mail via backend
      return true;
    };
  };
})

.controller('LoginCtrl', function($scope, $routeParams, User, $location, AppAuth) {
  $scope.registration = {};

  $scope.login = function() {
    $scope.loginResult = User.login({include: 'user', rememberMe: true}, $scope.credentials,
      function() {
        var next = $location.nextAfterLogin || '/';
        $location.nextAfterLogin = null;
        AppAuth.currentUser = $scope.loginResult.user;
        $location.path(next);
      },
      function(res) {
        $scope.loginError = res.data.error;
      }
    );
  };
  $scope.register = function() {
    $scope.user = User.save($scope.registration,
      function() {
        $scope.registerSuccess = true;
      },
      function(res) {
        $scope.registerError = res.data.error;
      }
    );
  };
});
