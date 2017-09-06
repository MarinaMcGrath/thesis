import { Injectable }    from '@angular/core';
import { Headers, Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

export class Pothole {
  name: string
  lat: number
  lng: number
}
export class Impact {
  date: Date
  force: Number
  pothole_id: Number
}
@Injectable()
export class RequestService {
  private headers = new Headers({'Content-Type': 'application/json'});
  private url = 'http://34.228.14.80:3030/'
  constructor(private http: Http) { }

  createImpact(info: any): any {
    return this.http.post(`${this.url}impact`,
      JSON.stringify(info),
    {headers: this.headers}).toPromise()
    .then(res => res.json()).catch(this.handleError);
  }
  createPothole(info: any): any {
    return this.http.post(`${this.url}pothole`,
      JSON.stringify(info),
    {headers: this.headers}).toPromise()
    .then(res => res.json()).catch(this.handleError);
  }
  getImpacts() {
    return this.http.get(`${this.url}impact`)
      .toPromise()
      .then(response => response.json().slice(0, 25) as Impact[])
      .catch(this.handleError)
  }
  getPotholes() {
    return this.http.get(`${this.url}pothole`)
      .toPromise()
      .then(response => response.json().slice(0, 25) as Pothole[])
      .catch(this.handleError)
  }
  getPothole(lat, lng) {
    return this.http.get(`${this.url}pothole?lat=${lat}&&lng=${lng}`)
    .toPromise()
    .then(res => res.json().data as Pothole)
    .catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }
}