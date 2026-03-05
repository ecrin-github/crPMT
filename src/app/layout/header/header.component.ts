import { Component, HostListener } from '@angular/core';
import { environment } from '../../../environments/environment';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  appVersion = environment.appVersion;

  dropdownOpen = false;

  private account: AccountInfo | null = null;

  constructor(private msal: MsalService) {
    this.account =
      this.msal.instance.getActiveAccount() ??
      this.msal.instance.getAllAccounts()[0] ??
      null;
  }

  get displayName(): string {
    return this.account?.name || this.account?.username || 'User';
  }

  get email(): string {
    return this.account?.username || '';
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeDropdown(): void {
    this.dropdownOpen = false;
  }

  logout(): void {
    this.closeDropdown();
    this.msal.logoutRedirect();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (!target.closest('.user')) this.dropdownOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.dropdownOpen = false;
  }
}