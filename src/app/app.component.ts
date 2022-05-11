import { Component, OnInit, } from '@angular/core';
import * as AOS from 'aos';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  
  constructor() {
    setTimeout(() => {AOS.refresh();}, 500);
  }

  ngOnInit() {
    AOS.init({
      // Global settings
      delay: 200,
      debounceDelay: 50, // the delay on debounce used while resizing window (advanced)
      // Settings that can be overridden on per-element basis, by `data-aos-*` attributes:
      once: false, // whether animation should happen only once - while scrolling down
      mirror: true, // whether elements should animate out while scrolling past them
    
    });
  
  }
}
