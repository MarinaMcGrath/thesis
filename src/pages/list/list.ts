import { Component } from '@angular/core';

import { NavController, NavParams } from 'ionic-angular';
import { RequestService } from '../../app/request.service';
import { SocialSharing } from '@ionic-native/social-sharing';
import { NativeGeocoder } from '@ionic-native/native-geocoder';


@Component({
  selector: 'page-list',
  templateUrl: 'list.html'
})

export class ListPage {
  impacts: Array<any>
  holes: Array<object>
  potholes: Array<any> = [];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public requestService: RequestService,
    private socialSharing: SocialSharing,
    private nativeGeocoder: NativeGeocoder
  ) {
    requestService.getImpacts()
      .then(hits => {
        this.impacts = hits.slice(0, 25).map(e => {
          e.date = e.date.slice(5, 7) + '-'+ e.date.slice(8, 10) + '-'+
          e.date.slice(0,4)
          e.force = e.force.reduce((a, c) => a + (c/9.8).toString().slice(0,3)+',', '')
          return e
        })
        this.impacts.forEach(impact => {
          this.requestService.getPotholeById(impact.pothole_id)
            .then(hole => {
              this.nativeGeocoder.reverseGeocode(hole.lat, hole.lng)
              .then(address => {
                if(impact.force === '0.1,') {
                  this.potholes.unshift({
                    date: impact.date,
                    force: impact.force,
                    name: hole.name,
                    num: address.subThoroughfare,
                    street: address.thoroughfare,
                    message:`
                      You manually added the ${hole.name} at ${address.subThoroughfare} ${address.thoroughfare}
                      on ${impact.date}. Thanks!`
                  })
                } else {
                  this.potholes.unshift({
                    date: impact.date,
                    force: impact.force,
                    name: hole.name,
                    num: address.subThoroughfare,
                    street: address.thoroughfare,
                    message:`
                      You hit the ${hole.name} at ${address.subThoroughfare} ${address.thoroughfare}
                      with a force of ${impact.force} Gs on ${impact.date}`
                  })
                }
              })
            })
        })
      })
  }
  postToFb(p: any): any {
    let message = `There's a huge pothole named ${p.name} at ${p.num} ${p.street}! @MayorLandrieu`
    this.socialSharing.share(message, null, null)
  }

}