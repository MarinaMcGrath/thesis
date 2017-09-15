import { Component, ViewChild } from '@angular/core';

import { Platform, MenuController, Nav } from 'ionic-angular';

import { Homepage } from '../pages/homepage/homepage';
import { ListPage } from '../pages/list/list';
import { LoginPage } from '../pages/login/login';
import { ManualEntryPage } from '../pages/manual-entry/manual-entry';
import { MapPage } from '../pages/map/map';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Events } from 'ionic-angular';


@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage = LoginPage;
  pages: Array<{title: string, component: any}>;

  constructor(
    public events: Events,
    public platform: Platform,
    public menu: MenuController,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen
  ) {
    this.splashScreen.show();
    this.initializeApp();

    // set our app's pages
    this.pages = [
      { title: 'Home Page', component: Homepage },
      { title: 'Add a Pothole', component: ManualEntryPage},
      { title: 'Greatest Hits', component: ListPage },
      { title: 'Pothole Map', component: MapPage },
    ];
  }
  menuClosed() {
    this.events.publish('menu:closed', '');
}

menuOpened() {
    this.events.publish('menu:opened', '');
}
  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  openPage(page) {
    // close the menu when clicking a link from the menu
    this.menu.close();
    // navigate to the new page if it is not the current page
    this.nav.setRoot(page.component);
  }
}
