import { Injectable } from '@angular/core';
import { ToastrService}  from 'ngx-toastr';
import { environment } from "../../../../environments/environment";
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { dateObjToTimeString } from 'src/assets/js/util';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private ws: WebSocket;

    constructor(private toastr: ToastrService, private oidcSecurityService: OidcSecurityService) { }
    
    public startConnection = () => {
        this.oidcSecurityService.getAccessToken().subscribe((token) => {
            if (token) {
                // Need to pass token like this (see https://stackoverflow.com/a/77060459)
                this.ws = new WebSocket((environment.wsBaseUrl + 'push-notifications'), [
                    `${token}`
                ]);
                this.ws.onopen = () => {
                    this.ws.onmessage = (event) => {
                        const data = JSON.parse(event.data);
                        this.showNotification(data);
                        if (data.id) {   // If it was a stored notification (has id), send message to delete it from DB
                            this.ws.send(JSON.stringify({"id": data.id, "consumed": "true"}));
                        }
                    }
                }
            }
        });
    }
    
    showNotification(data) {
        console.log(`notification ${JSON.stringify(data)}`);
        this.toastr.success(`${dateObjToTimeString(new Date(data?.time*1000))} - ${data?.message}`, '', { timeOut: 60000, extendedTimeOut: 60000 });
    }

    close() {
        this.ws.close();
    }
}
