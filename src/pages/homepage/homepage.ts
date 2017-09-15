import { Component } from '@angular/core';
import { IonicPage, Platform } from 'ionic-angular';
import { DeviceMotion } from '@ionic-native/device-motion';
import { RequestService } from '../../app/request.service';
import { TextToSpeech } from '@ionic-native/text-to-speech';
import { Geolocation } from '@ionic-native/geolocation';
import { NativeGeocoder } from '@ionic-native/native-geocoder';
import { NativeStorage } from '@ionic-native/native-storage';

@IonicPage()
@Component({
  selector: 'page-homepage',
  templateUrl: 'homepage.html',
})
export class Homepage {
  user: string;
  private moveCounter:number = 0;
  trigger: string = 'none';
  jolts: number[] = [1, 1, 1];
  limit:number= 3;
  joltSize:number = 18;
  coords: any = { latitude: 100, longitude: 100, heading: 100 };
  holes: any = [1,1,1];
  realGeo: boolean  = false;
  trackerStarted:Boolean = false;
  joltWatcherStarted: Boolean = false;
  toSave: any = [1, 2, 3];
  workOrder: number = 0;
  closest: object = { heading: 1000, lat: 1, lng: 1 };
  subscription;
  used: object = {};
  showSettings: boolean = false;
  forReal: boolean = false;

  constructor(
    private geolocation: Geolocation,
    private gc: NativeGeocoder,
    private tts: TextToSpeech,
    private requestService: RequestService,
    public platform: Platform,
    private nativeStorage: NativeStorage,
    private deviceMotion: DeviceMotion) {

    this.nativeStorage.getItem('user')
      .then(user => this.user = user.name);
  }
  ionViewDidEnter() {
    this.platform.ready().then(() => this.watchLoc());
  }
  makeFake(force) {
    this.realGeo = false;
    this.subscription ? this.subscription.unsubscribe() : 1;
    this.coords = {latitude: 29.927594 + Math.random() * .08865,
      longitude:  -90.132690 + Math.random() * .196903,
      heading: 0};
    this.saveImpact(force);
  }
  realLocationToggle() {
    this.subscription ? this.subscription.unsubscribe() : 1;
    this.realGeo = !this.realGeo;
    this.watchLoc();
  }
  watchLoc() {
    const cb = (data) => {
      this.coords = data.coords;
      this.requestService.getPotholes().then((potholes) => {
        !this.trackerStarted ? (
          this.tracker(potholes), this.trackerStarted = true) : 1;
      });
      if (!this.joltWatcherStarted) {
        this.platform.is('cordova') ? (
          this.joltWatcher(), this.joltWatcherStarted = true
        ) : 1;
      }
    };
    let latitude;
    let longitude;
    let heading;
    this.realGeo ? (this.subscription = this.geolocation.watchPosition(
      { enableHighAccuracy: true }).subscribe(loc => cb(loc))) : (
      latitude = 29.927594 + Math.random() * .08865,
      longitude = -90.132690 + Math.random() * .196903,
      heading = 0,
      cb({ coords: { latitude, longitude, heading } })
    );
  }
  joltWatcher = () => {
    let lastX;
    let lastY;
    let lastZ;
    this.deviceMotion.watchAcceleration({ frequency:200 })
    .subscribe((acc) => {
      lastX ? 1 : { x: lastX, y: lastY, z: lastZ } = acc;
      const total = Math.abs(acc.x - lastX) +
      Math.abs(acc.y - lastY) + Math.abs(acc.z - lastZ);
      total > this.joltSize ? (
        this.moveCounter = this.moveCounter + 1, this.jolts.push(total)
      ) : (
        this.moveCounter = Math.max(0, this.moveCounter = this.moveCounter - 1),
        this.jolts = []
      );
      if (this.moveCounter > this.limit) {
        this.saveImpact(this.jolts);
        this.jolts = [];
        this.moveCounter = 0;
      }
      lastX = acc.x;
      lastY = acc.y;
      lastZ = acc.z;
    });
  }
  getPotholes(): void {
    this.requestService.getPotholes()
    .then(values => this.holes = values);
  }
  bearing(lat1,lng1,lat2,lng2) {
    const toRad = deg => deg * Math.PI / 180;
    const toDeg = rad => rad * 180 / Math.PI;
    const dLon = toRad(lng2 - lng1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2))
    - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    const brng = toDeg(Math.atan2(y, x));
    return ((brng + 360) % 360);
  }
  warner(pits) {
    let closest = { d: 100, lat: 100, lng: 100 };
    pits.forEach((p) => {
      p.d < closest.d ? closest = p : 1;
      const b = this.bearing(this.coords.latitude, this.coords.longitude, p.lat, p.lng);
      const myB = Number(this.coords.heading);
      this.trigger = `to closest is ${b}, your b is ${myB}`;
      let mes;
      const rounded = p.d.toString().slice(0,3);
      const range1 = [myB - 20, myB + 20];
      const range = range1.map(head => head < 0 ? 360 + head : head > 360 ? head - 360 : head);
      if (b < range[1] && b > 0 || b > range[0] && b < 360) {
        let addr;
        this.gc.reverseGeocode(p.lat, p.lng)
        .then((result) => {
          addr = result.subThoroughfare + ' ' + result.thoroughfare;
          this.used[JSON.stringify(addr)] === true ? 1 : (
            this.used[JSON.stringify(addr)] = true,
            mes = `Approaching ${p.name} ${rounded} miles ahead at ${addr}`,
            this.platform.is('cordova') ? this.tts.speak(mes) : 1
          );
        });
      }
    });
  }
  tracker(holes) {
    const watching = {
      '1': { t: 3, d: .5, st: holes.slice() },
      '2': { t: 10, d: .8, st: [] },
      '3': { t: 20, d: 2, st: [] }};
    const workOrder = this.workOrder;
    const sorter = (object, index) => {
      const sorted = { 1: [],2: [], 3: [] };
      object.st.forEach((h) => {
        h.d = this.getDist(this.coords.latitude, this.coords.longitude, h.lat, h.lng);
        h.d < watching['1'].d ? sorted['1'].push(h) : (
          h.d < watching['2'].d ? sorted['2'].push(h) : (
            h.d < watching['3'].d ? sorted['3'].push(h) : 1
        ));
      });
      for (const key in watching) {
        key === index ? watching[key].st = sorted[key].slice() : (
          watching[key].st = watching[key].st.concat(sorted[key]));
      }
      index === '1' ? (this.warner(watching[index].st)) : 1;
      workOrder === this.workOrder ? (
        setTimeout(() =>  sorter(watching[index], index), watching[index].t * 1000)
      ) : 1;
    };
    for (const key in watching) {
      sorter(watching[key], key);
    }
    setTimeout(() => {
      this.requestService.getPotholes().then((potholes) => {
        this.workOrder = this.workOrder + 1;
        this.tracker(potholes);
      });
    },         60000);
  }
  saveImpact(jolts) {
    const round = (t, d) => Number(Math.round(Number(t + 'e' + d)) + 'e-' + d);
    this.speak(jolts);
    let latitude;
    let longitude;
    this.requestService.snapToRoad(this.coords.latitude, this.coords.longitude)
    .then((res) => {
      latitude = round(res.snappedPoints[0].location.latitude, 4);
      longitude = round(res.snappedPoints[0].location.longitude, 4);
      const roundedJolts = jolts.map(j => Math.floor(j));
      this.toSave = [latitude, longitude, roundedJolts];
      this.requestService.getPotholeByLocation(latitude, longitude)
      .then((data) => {
        if (!data || data.length === 0) {
          this.requestService.createPothole({
            name: this.name(),
            lat: latitude,
            lng: longitude,
          })
          .then((hole) => {
            this.nativeStorage.getItem('user')
              .then((user) => {
                this.requestService.createImpact({
                  force: roundedJolts,
                  users_id: user.id,
                  pothole_id: hole.id,
                }).then(impact => console.log(impact, 108));
              });
          });
        } else {
          this.nativeStorage.getItem('user')
            .then((user) => {
              this.requestService.createImpact({
                force: roundedJolts,
                users_id: user.id,
                pothole_id: data[0].id,
              }).then(impact => 1);
            });
        }
      });
    });
  }
  name() {
    const first = ['cavern', 'pit', 'hole', 'jaws', 'crater', 'pit',
      'rut', 'bump', 'dent'];
    const second = ['despair', 'lost cars', 'infinite depth',
      'Moria', 'tremendous damage', 'get your checkbook out',
      'desperation', 'disheartenment', 'dashed hopes'];
    const random = () => Math.floor(Math.random() * first.length);
    return first[random()] + ' of ' + second[random()];
  }
  speak(ar) {
    const str = ar.reduce((a, c) => `${a} ${Number(c.toString().slice(0, 3))
      .toString()} gees,`,'');
    this.tts.speak({
      text: `That impact was ${str}`,
      locale: 'en-GB',
    });
  }
   // Credit: http://stackoverflow.com/a/27943/52160
  getDist(lat1,lon1,lat2,lon2) {
    const deg2rad = deg => deg * (Math.PI / 180);
    const dLat = deg2rad(lat2 - lat1);  // deg2rad below
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 7919.204 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
