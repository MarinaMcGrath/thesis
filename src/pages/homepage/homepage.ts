import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { DeviceMotion, DeviceMotionAccelerationData } from '@ionic-native/device-motion';
import {ShakeProvider } from '../../app/providers/shakeProvider';
import { Geolocation } from '@ionic-native/geolocation';

import { FormsModule }   from '@angular/forms';

@IonicPage()
@Component({
  selector: 'page-homepage',
  templateUrl: 'homepage.html',
  providers: [ShakeProvider]
})
export class Homepage {
  private lastX:number;
  private lastY:number;
  private lastZ:number;
  private moveCounter:number = 0;
  platform: Platform;
  accels: Array<number> = [0, 0, 0];
  limit:number;
  joltSize:number;
  trigger:String = 'none'
  deviceMotion: DeviceMotion
  coord: Array<number> = [0, 0, 0]

  constructor(
  private navController:NavController,
  platform:Platform,
  deviceMotion:DeviceMotion,
  private geolocation: Geolocation) {
    this.limit = 2;
    this.joltSize = 1;
    platform.ready().then(() => {
      let watch = this.geolocation.watchPosition();
      watch.subscribe((data) => {
        this.coord[0] = data.coords.latitude
        this.coord[1] = data.coords.longitude
        this.coord[2] = data.coords.speed
      })
      if (platform.is('cordova') === true) {
        const check = () => {
          this.accels = [1,1,1]
          var subscription = deviceMotion.watchAcceleration({
            frequency:200}).subscribe(acc => {
              this.accels = [2,2,2]
              if(!this.lastX) {
                this.lastX = acc.x;
                this.lastY = acc.y;
                this.lastZ = acc.z;
                return;
              }
              this.accels = [acc.x, acc.y, acc.z];
              let deltaX:number, deltaY:number, deltaZ:number;
              deltaX = Math.abs(acc.x-this.lastX);
              deltaY = Math.abs(acc.y-this.lastY);
              deltaZ = Math.abs(acc.z-this.lastZ);
              if(deltaX + deltaY + deltaZ > 3) {
                this.moveCounter++;
              } else {
                this.moveCounter = Math.max(0, --this.moveCounter);
              }
              if(this.moveCounter > this.limit) {
                console.log('SHAKE');
                this.saveTrigger();
                this.moveCounter=0;
              }
            });
          }
        check()
      } else {
        setInterval(() =>  {
          this.trigger = 'SHOOOK!';
          setTimeout(() => {this.trigger = ''}, 2000)
        }, 3000)
      }
    })
  }
  saveTrigger() {
    this.trigger = 'SHOOOK!';
    setTimeout(() => {this.trigger = ''}, 2000)
  }
}
