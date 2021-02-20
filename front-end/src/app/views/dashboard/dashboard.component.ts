import { Component, ViewEncapsulation} from '@angular/core'; 
import {WebcamImage, WebcamInitError} from 'ngx-webcam'; 
import {Subject, Observable} from 'rxjs'; 
import { AlertConfig } from 'ngx-bootstrap/alert';

export function getAlertConfig(): AlertConfig {
return Object.assign(new AlertConfig(), { type: 'success' });
}

@Component({
  templateUrl: 'dashboard.component.html',
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
  .alert-md-local {
    background-color: #009688;
    border-color: #00695C;
    color: #fff;
  }
  `
  ],
  providers: [{ provide: AlertConfig, useFactory: getAlertConfig }]
})
export class DashboardComponent{
    title = 'gfgangularwebcam'; 
    descargarbtn: HTMLButtonElement;
    nombreimg: HTMLInputElement;
    divAlert: HTMLDivElement;
    generatedImage: string;
    alertsDismiss = [];
    i:number = 0;

    public webcamImage: WebcamImage = null; 
    private trigger: Subject<void> = new Subject<void>(); 


    triggerSnapshot(): void {
        this.descargarbtn = document.getElementById('descargar-boton') as HTMLButtonElement;
        this.descargarbtn.disabled = false;
        this.trigger.next(); 
    } 

    handleImage(webcamImage: WebcamImage): void { 
        console.info('Saved webcam image', webcamImage); 
        this.webcamImage = webcamImage; 
    }

    descargarImagen(): void {
        this.nombreimg = document.getElementById('nombre-img') as HTMLInputElement;
        this.divAlert = document.getElementById('div-alert') as HTMLDivElement;
        this.divAlert.className = ""
        this.divAlert.textContent = ""
        if (this.nombreimg.value.toString().length > 0){
          const linkSource = 'data:image/jpg;base64,' + this.webcamImage.imageAsBase64;
          const downloadLink = document.createElement("a");
          const fileName = this.nombreimg.value + ".jpg";

          downloadLink.href = linkSource;
          downloadLink.download = fileName;
          downloadLink.click();
          this.divAlert.className = "alert alert-success";
          this.divAlert.innerHTML = "<strong>ÉXITO:</strong> imagen descargada éxitosamente."
        }
        else{
            this.divAlert.className = "alert alert-danger";
            this.divAlert.innerHTML = "<strong>ALERTA:</strong> debe proveer nombre para guardar la imagen."
        }
    }
    public get triggerObservable(): Observable<void> { 
        return this.trigger.asObservable(); 
    } 

    

    public handleInitError(error: WebcamInitError): void {
    if (error.mediaStreamError && error.mediaStreamError.name === "NotAllowedError") {
        console.warn("La cámara no se pudo iniciar");
    }
    }
}
