import { Injectable }    from '@angular/core'
import { Headers, Http } from '@angular/http'
import { NativeStorage } from '@ionic-native/native-storage'


import 'rxjs/add/operator/toPromise';

export class Pothole {
  name: string;
  lat: number;
  lng: number;
}
export class Impact {
  date: Date;
  force: number[];
  pothole_id: Number;
  user_id: Number;
}
@Injectable()
export class RequestService {
  private headers = new Headers({ 'Content-Type': 'application/json' });
  private url = 'https://cratergator.club/';
  constructor(private http: Http, private nativeStorage: NativeStorage) { }

  snapToRoad(lat, lng) {
    const key = 'AIzaSyCDkBmhOoNsGrpIXsS4R-CT4IoVLrYuATU';
    const roadUrl = `https://roads.googleapis.com/v1/snapToRoads?path=${lat},${lng}&key=${key}`;
    return this.http.get(roadUrl).toPromise().then(res => res.json())
    .catch(this.handleError);
  }
  // post requests
  createImpact(info: any): any {
    return this.http.post(`${this.url}impact`,
                          JSON.stringify(info),
                          { headers: this.headers }).toPromise()
    .then(res => res.json()).catch(this.handleError);
  }

  createPothole(info: any): any {
    return this.http.post(`${this.url}pothole`,
                          JSON.stringify(info),
                          { headers: this.headers }).toPromise()
    .then(res => res.json()).catch(this.handleError);
  }

  createUser(info: any): any {
    return this.http.post(`${this.url}users`,
                          JSON.stringify(info),
                          { headers: this.headers }).toPromise()
    .then(res => res.json())
    .catch(this.handleError);
  }

  getImpacts() {
    return this.nativeStorage.getItem('user')
      .then((user) => {
        return this.http.get(`${this.url}impact?users_id=${user.id}`)
          .toPromise()
          .then(response => response.json() as Impact[])
          .catch(this.handleError);
      });
  }
  getPotholes() {
    return this.http.get(`${this.url}pothole`)
      .toPromise()
      .then(response => response.json() as Pothole[])
      .catch(this.handleError);
  }

  getUser(userToken: string): any {
    return this.http.get(`${this.url}users?token=${userToken}`)
      .toPromise()
      .then(res => res.json())
      .catch(this.handleError);
  }

  getPotholeByLocation(lat, lng) {
    return this.http.get(`${this.url}pothole?lat=${lat}&&lng=${lng}`)
      .toPromise()
      .then(res => res.json())
      .catch(this.handleError);
  }

  getPotholeById(id: string) {
    return this.http.get(`${this.url}pothole?id=${id}`)
      .toPromise()
      .then(res => res.json()[0] as Pothole)
      .catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    return Promise.reject(error.message || error);
  }
}
