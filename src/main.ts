import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";


if (environment.production) {
  enableProdMode();
}

polyfillCountryFlagEmojis();

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));