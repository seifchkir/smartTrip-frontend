import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `

    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  title = 'travel-app';
}
