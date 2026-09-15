import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/** Secondary sidebar destinations that are not yet implemented as routed pages. */
interface ComingSoonNavItem {
  label: string;
  icon: string;
}

@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
})
export class AdminShell {
  protected readonly isMobileNavOpen = signal(false);

  protected readonly comingSoonNavItems: readonly ComingSoonNavItem[] = [
    { label: 'Factions & Teams', icon: 'shield' },
    { label: 'Kiosk Settings', icon: 'settings_cell' },
  ];

  protected toggleMobileNav(): void {
    this.isMobileNavOpen.update((isOpen) => !isOpen);
  }

  protected closeMobileNav(): void {
    this.isMobileNavOpen.set(false);
  }
}
