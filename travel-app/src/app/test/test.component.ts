import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule],
  template: '<h1>Test Component Works!</h1>',
  styles: []
})
export class TestComponent {}
