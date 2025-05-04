import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule],
  template: '<div>Test Component Works!</div>',
  styles: ['div { padding: 20px; background: #f0f0f0; }']
})
export class TestComponent {}
