import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ReportService } from './services/report.service';

@Component({
  standalone:true,
  selector: 'app-root',
  templateUrl: './app.component.html',  
  styleUrls: ['./app.component.scss'],  
  imports:[RouterOutlet],
})
export class AppComponent {
  title = 'PyramakerzTask';
}
