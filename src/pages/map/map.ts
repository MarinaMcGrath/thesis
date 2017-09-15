import { GoogleMaps, GoogleMap, GoogleMapsEvent, GoogleMapOptions,
  // CameraPosition, MarkerOptions,   Marker
 } from '@ionic-native/google-maps';
import { Component } from "@angular/core/";
import { Platform } from 'ionic-angular';
import { RequestService } from '../../app/request.service'
import { Events } from 'ionic-angular';


@Component({
  selector: 'Map-page',
  templateUrl: 'map.html'
})
export class MapPage {
  map: GoogleMap;
  holes: any = [1,1,1]
  mapElement: HTMLElement;
  mapLoaded:Boolean = false
  snap

  constructor(private googleMaps: GoogleMaps, public platform: Platform,
  private requestService:RequestService, public events:Events,
) { events.subscribe('menu:opened', () => this.map.setClickable(false))
    events.subscribe('menu:closed', () => this.map.setClickable(true))
  }
  ionViewDidEnter(){
    this.platform.ready().then(() => {
      this.loadMap()
      this.requestService.snapToRoad(29.944748, -90.070081)
      .then(res => console.log(res.snappedPoints[0].location))
    });
  }
  bearing(lat1,lng1,lat2,lng2) {
    const toRad = (deg) => deg * Math.PI / 180
    const toDeg = (rad) => rad * 180 / Math.PI
    var dLon = toRad(lng2-lng1);
    var y = Math.sin(dLon) * Math.cos(toRad(lat2));
    var x = Math.cos(toRad(lat1))*Math.sin(toRad(lat2)) - Math.sin(toRad(lat1))*Math.cos(toRad(lat2))*Math.cos(dLon);
    var brng = toDeg(Math.atan2(y, x));
    return ((brng + 360) % 360);
  }
  loadMap() {
    this.mapLoaded = true;
      this.mapElement = document.getElementById('map');
      let mapOptions: GoogleMapOptions = {
        camera: {
          target: {lat: 29.945854, lng: -90.070120 }, zoom: 11, tilt: 0
        }
      }
    this.map = this.googleMaps.create(this.mapElement, mapOptions);
    this.map.one(GoogleMapsEvent.MAP_READY).then(() => {
      this.requestService.getPotholes().then(values => {
        values.forEach(ph => {
          // let name = this.bearing(29.945854, -90.070120, ph.lat, ph.lng).toString() + ' ' + this.warner(ph)
          this.map.addMarker({
            title: ph.name,
            // ph.name,
            icon: 'blue',
            animation: 'DROP',
            position: {
              lat: ph.lat,
              lng: ph.lng
            }
          })
        });
      })
    })
  }
}







