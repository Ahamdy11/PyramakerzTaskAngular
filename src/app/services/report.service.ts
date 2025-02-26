import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = 'https://localhost:7119/api/Reports';

  constructor(private http: HttpClient) {}

  getSchools(): Observable<any> {
    return this.http.get(`${this.apiUrl}/schools`);
  }

  getYears(schoolId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/years/${schoolId}`);
  }

  getGrades(yearId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/grades/${yearId}`);
  }

  getClasses(gradeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/classes/${gradeId}`);
  }

  getStudents(classId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/students/${classId}`);
  }
}