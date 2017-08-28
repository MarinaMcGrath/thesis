import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { DeviceMotion, DeviceMotionAccelerationData } from '@ionic-native/device-motion';
import { FormsModule }   from '@angular/forms';

@IonicPage()
@Component({
  selector: 'page-homepage',
  templateUrl: 'homepage.html',
})
export class Homepage {
  private lastX:number;
  private lastY:number;
  private lastZ:number;
  private moveCounter:number = 0;
  platform: Platform;
  accels: Array<number>;
  limit:number;
  show:Boolean;
  joltSize:number;

  constructor(
    private navController:NavController,
    platform:Platform,
    deviceMotion: DeviceMotion) {
    this.loadAcc();
    this.limit = 2;
    this.show = false;
    this.joltSize = 1;

    if (this.show) {
      platform.ready().then(() => {
        var subscription = deviceMotion.watchAcceleration({frequency:200}).subscribe(acc => {
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

            this.moveCounter=0;
          }
        });
      });
    }
  }
  loadMore() {
    console.log('load more cats');
    this.loadAcc();
  }
  loadAcc() {
    this.accels = [Math.random(), this.limit, 1];
  }
}
