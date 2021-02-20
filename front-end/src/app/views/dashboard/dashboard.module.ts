import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { WebcamModule } from 'ngx-webcam';
import { CommonModule } from '@angular/common';  

import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';

@NgModule({
  imports: [
    FormsModule,
    CommonModule,
    DashboardRoutingModule,
    WebcamModule,
    BsDropdownModule,
    ButtonsModule.forRoot()
  ],
  declarations: [ DashboardComponent ]
})
export class DashboardModule { }
