import { Component } from '@angular/core';
import { IonicPage, Platform } from 'ionic-angular';
import { DeviceMotion } from '@ionic-native/device-motion';
import { RequestService } from '../../app/request.service'
import { SmartAudio } from '../../providers/smart-audio/smart-audio'
import { TextToSpeech } from '@ionic-native/text-to-speech';
import { Geolocation } from '@ionic-native/geolocation';

@IonicPage()
@Component({
  selector: 'page-homepage',
  templateUrl: 'homepage.html'
})
export class Homepage {
  private moveCounter:number = 0;
  jolts: Array<number> = [1, 1, 1]
  limit:number= 3
  joltSize:number = 10;
  coords: any = {latitude: 100, longitude: 100}
  holes: any = [1,1,1]
  realGeo: boolean  = false
  trackerStarted:Boolean = false
  joltWatcherStarted: Boolean = false
  toSave: any = [1, 2, 3]

  constructor(private geolocation: Geolocation,
    private tts: TextToSpeech,
    private requestService: RequestService,
    public smartAudio:SmartAudio,
    public platform:Platform,
    private deviceMotion:DeviceMotion) {}
  ionViewDidEnter(){
    this.platform.ready().then(() => {
      // smartAudio.preload('sound', 'assets/sounds/beep15.mp3')
      this.platform.is('cordova') ? this.watchLoc() : 1
    })
  }
  watchLoc() {
    this.geolocation.watchPosition({enableHighAccuracy: true})
    .subscribe(data => { this.coords = data.coords
      // !this.trackerStarted ? this.tracker() : 1
      this.trackerStarted = true
      !this.joltWatcherStarted ? this.joltWatcher() : 1
      this.joltWatcherStarted = true
    })
  }
  getPotholes(): void {
    this.requestService.getPotholes()
    .then(values => this.holes = values)
  }
  joltWatcher = () => {
    let lastX, lastY, lastZ
    this.deviceMotion.watchAcceleration({frequency:200})
    .subscribe(acc => {lastX ? 1 : {x: lastX, y: lastY, z: lastZ} = acc;
      let total = Math.abs(acc.x-lastX) +
      Math.abs(acc.y-lastY) + Math.abs(acc.z-lastZ)
      total > this.joltSize ? (
        this.moveCounter++, this.jolts.push(total)
    ) : (
      this.moveCounter = Math.max(0, --this.moveCounter),
      this.jolts = []
    )
      if(this.moveCounter > this.limit) {
        this.saveImpact(this.jolts)
        this.jolts = []
        this.moveCounter=0;
      }
      lastX = acc.x;
      lastY = acc.y;
      lastZ = acc.z;
    });
  }
  // Credit: http://stackoverflow.com/a/27943/52160
  saveImpact(jolts) {
    const round = (t, d) => Number(Math.round(Number(t+'e'+d))+'e-'+d)
    this.speak(jolts)
    let latitude, longitude
    this.realGeo ? { latitude, longitude } = this.coords : (
      latitude = 29.927594 + Math.random() * .08865,
      longitude = -90.132690 + Math.random() * .196903
    )
    latitude = round(latitude, 4)
    longitude = round(longitude, 4)
    jolts = jolts.map(j => Math.floor(j))
    this.toSave = [latitude, longitude, jolts]
    this.requestService.getPothole(latitude, longitude)
    .then(data => {
      if (!data) {
        this.requestService.createPothole({
          name: this.name(),
          lat: latitude,
          lng: longitude
        })
        .then(hole => {
          console.log(103)
          this.requestService.createImpact({
            force: jolts,
            users_id: null,
            pothole_id: hole.id
          }).then(impact => console.log(impact, 108))
        })
      } else {
        this.requestService.createImpact({
          force: jolts,
          users_id: null,
          pothole_id: data[0].id
        }).then(impact => console.log(impact, 'impact saved'))
      }
    })
  }
  getDistanceFromLatLonInMi(lat1,lon1,lat2,lon2) {
    const deg2rad = (deg) => deg * (Math.PI/180)
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1);
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    return 7919.204 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }



  // tracker() {
  //   let dist = 1.5
  //   let {latitude, longitude} = this.coords //user location
  //   const lessThan2Minutes = holes.reduce((acc, cur) => {
  //     let d = this.getDistanceFromLatLonInMi(latitude, longitude,
  //       cur.lat, cur.lng)
  //       console.log(d, cur.name)
  //       return (d < dist ? acc.concat(cur) : acc);
  //   }, [])
  //   console.log(lessThan2Minutes)
  //   this.tracker()
  // }






  name() {
    let first = ['cavern', 'pit', 'hole', 'jaws', 'crater', 'pit',
    'rut', 'bump', 'dent']
    let second = ['despair', 'lost cars', 'infinite depth',
    'Moria', 'tremendous damage', 'get your checkbook out',
    'desperation', 'disheartenment', 'dashed hopes']
    const random = () => Math.floor(Math.random() * first.length)
    return first[random()] + ' of ' + second[random()]
  }
  speak(ar) {
    let roundedInGs = ar.map(n => Math.floor(n/9.8))
    let str = roundedInGs.reduce((a, c) => `${a} ${c.toString()} gees,`, '')
    this.tts.speak(`That impact was ${str}`)
  }
}