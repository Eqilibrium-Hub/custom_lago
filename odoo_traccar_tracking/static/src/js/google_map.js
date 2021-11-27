/* Copyright (c) 2018-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>) */
/* See LICENSE file for full copyright and licensing details. */

odoo.define('odoo_traccar_tracking.google_map_js', function (require) {
    "use strict";
    var FormRenderer = require("web.FormRenderer");
    var ajax = require('web.ajax');
    var core = require ('web.core'); 
    var QWeb = core.qweb; 

    var options = {
        imagePath: '/odoo_traccar_tracking/static/src/lib/m'
    };
    // Start/Finish icons
    var icons = {
      car: new google.maps.MarkerImage(
      // URL
      './odoo_traccar_tracking/static/description/img/coche.png'
      ),
      end: new google.maps.MarkerImage(
      // URL
      './odoo_traccar_tracking/static/description/img/partida.png'
      ),
      bar: new google.maps.MarkerImage(
        // URL
        './odoo_traccar_tracking/static/description/img/bote.png'
      ),
      contractor: new google.maps.MarkerImage(
          // URL
        './odoo_traccar_tracking/static/description/img/contratista.png'
      )  
    };

    FormRenderer.include({
      _renderView: function () {
        var self = this;
        var res = this._super.apply(this, arguments);
        return res.then(function () {
          self._map = self.$el.find('#traccarMap');
          if (self._map.length > 0) {
            self.render_google_map();
          }
        })
      },

      render_google_map: function () {
        var ds = new google.maps.DirectionsService();
        var dr = new google.maps.DirectionsRenderer({suppressMarkers: true});
        var detail = this.state.data;
        if (detail) {
          var latinit = parseFloat(detail.source_lat,);
          var lnginit = parseFloat(detail.source_long);
          var coord =  new google.maps.LatLng(10.34447, -67.04325);

          this.map = new google.maps.Map(this._map[0], {
              zoom: 10,
              center: coord
          });
        
          //Mapa de Trip Dietails
          if (this._map.attr('route') == 'true') {
            
            this.createRouteForPoints(ds, dr, detail);
            ajax.jsonRpc('/post_vehicle', 'call', {} ).then(function(data) {
              console.log(data);
            });
          }
          // marker for all active driver
          if (this._map.attr('feature') == 'true') {
            this.activeDriverLocations();
          }
        
          dr.setMap(this.map);

        }
      },

      createRouteForPoints: function (ds, dr, detail) {
       var self = this;
        //  coordenadas de inicio
       var latinit = parseFloat(detail.source_lat,);
       var lnginit = parseFloat(detail.source_long);
       var init =  new google.maps.LatLng(latinit, lnginit);
        // coordenadas de destino
       var latdest = parseFloat(detail.destination_lat);
       var lngdest = parseFloat(detail.destination_long);
       var dest = new google.maps.LatLng(latdest, lngdest);

        ds.route({
            origin: init,
            destination: dest,
            travelMode: google.maps.TravelMode.DRIVING
          },(result, status) => {
            if (status = google.maps.DirectionsStatus.OK) {
              
              // get distancia
              dr.setDirections(result);
              console.log(result);
              var leg = result.routes[0];
              if (leg) {
                
                   
              var leg = result.routes[ 0 ].legs[ 0 ];
              var distancia = result.routes[0].legs[0].distance.text;
              var duration = result.routes[0].legs[0].duration.text;
              var direc_start_name = result.routes[0].legs[0].start_address;
              var direc_end_name = result.routes[0].legs[0].end_address;
              var title_s = "Direccion de Salida: ";
              var title_e = "Direccion de Llegada: ";
              
              this.makeMarker( leg.start_location, icons.car, distancia, duration,  direc_start_name, title_s);
              this.makeMarker( leg.end_location, icons.end, distancia, duration,  direc_end_name, title_e);
                  
              }else if(result.request){
                
                var origen = result.request.origin.location;
                var destination = result.request.destination.location;
                var title_s = "Distancia de la Embarcacion: ";
                var title_e = "Distancia al punto de Llegada: ";
                // CALCULAR DISTANCEA ENTRE PUNTOS EN MILLAS NAUTICAS
                var distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(
                  init,
                  dest
                );
                distanceInMeters = distanceInMeters/1852;
                var distancia = distanceInMeters.toFixed(4); 
                this.markerMaritimo(origen, icons.bar, distancia, title_e);
                this.markerMaritimo(destination, icons.end, distancia, title_s);

                var latlngbounds = new google.maps.LatLngBounds();
                latlngbounds.extend(origen);
                latlngbounds.extend(destination);
                this.map.fitBounds(latlngbounds);
                
                
                
              }
           
            }else{
              console.log("Directions request failed due to " + status);
            }
        });
          
      },

      activeDriverLocations: function () {
        
        var self = this;
        var locations = self.state.data.driver_locations;
        var latlngbounds = new google.maps.LatLngBounds();
        
        if (locations) {
          
          self.markers = [];
          locations = locations.split(';');
          console.log('si ahi locacion'); 
          for (var i = 0; i < locations.length; i++) {
            
            var locat = self.parseResponse(locations[i]);

            self.createFeature(locat, icons.contractor);
            var latLng = new google.maps.LatLng(locat.lat, locat.long); 
            
            latlngbounds.extend(latLng);

            console.log('individual'+ latLng); 
          }
          
          
          this.map.fitBounds(latlngbounds);
          
          new MarkerClusterer(self.map, self.markers, options);
        }
      },

      parseResponse: function (data) {
        var location = data.split(":");
        var response = {name: location[0]};
        location = location[1].split(',');
        response.lat = location[0];
        response.long = location[1];
        return response;
      },
      // marker de las rutas terrestre
      makeMarker: function (leg, icon, duration, distance, direccion, title) {
        var marker = new google.maps.Marker({
          position: leg,
          map: this.map,
          icon: icon
          });

        var infoWindow = new google.maps.InfoWindow();

        var onMarkerClick = function() {
          var content = `
          <h2 class"p-1 text-center"><b>Datos del Viaje</b></h2>
          <p><h4><b>${title}</b></h4>${direccion}</p>
          <p><h4><b>Duracion aproximada: </b></h4>${duration}</p>
          <p><h4><b>Distancia: </b></h4>${distance}</p>                    
          `
          infoWindow.setContent(content);
          infoWindow.open(this.map, this);
        };

        google.maps.event.addListener(marker, 'click', onMarkerClick);
      },
      // marker de las rutas maritimas 
      markerMaritimo: function (leg, icon,distance, title) {
        var marker = new google.maps.Marker({
          position: leg,
          map: this.map,
          icon: icon
          });

        var infoWindow = new google.maps.InfoWindow();

        var onMarkerClick = function() {
          var content = `
          <h2 class"p-1 text-center"><b>Datos del Viaje</b></h2>
          <p><h4><b>${title}</b></h4>${distance} Millas Nauticas</p>                    
          `
          infoWindow.setContent(content);
          infoWindow.open(this.map, this);
        };

        google.maps.event.addListener(marker, 'click', onMarkerClick);
      },
      // marker de los devices
      createFeature: function (coord, icon) {
        
        console.log('createfacture'+coord.name);
        
        var latLng = new google.maps.LatLng(coord.lat, coord.long);
        // var
        var marker = new google.maps.Marker({
            partner: coord.name,
            map: this.map,
            position: latLng,
            icon: icon
        });
        var infoWindow = new google.maps.InfoWindow();
           var onMarkerClick = function() {
            var content = `<p class="font-weight-bold mb-0">${coord.name}</p>`
            infoWindow.setContent(content);
            infoWindow.open(this.map, this); 
           };
  
        google.maps.event.addListener(marker, 'click', onMarkerClick);
      
      }
 
    });

  })
