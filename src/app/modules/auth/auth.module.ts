import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthRoutingModule } from './auth-routing.module';
import { LogoutComponent } from './logout/logout.component';
import { AuthComponent } from './auth.component';
// import {TranslationModule} from '../i18n/translation.module';
// import { UserGuideComponent } from './user-guide/user-guide.component';

@NgModule({
  declarations: [
    LogoutComponent,
    AuthComponent,
    // UserGuideComponent,
  ],
  imports: [
    CommonModule,
    // TranslationModule,
    AuthRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
  ]
})
export class AuthModule { }
