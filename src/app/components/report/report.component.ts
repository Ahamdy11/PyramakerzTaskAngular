import { Component, OnInit } from '@angular/core';
import { ReportService } from '../../services/report.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

@Component({
  standalone: true, 
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
  imports: [FormsModule, CommonModule],
  providers: [ReportService]
})
export class ReportComponent implements OnInit {
  schools: any[] = [];
  years: any[] = [];
  grades: any[] = [];
  classes: any[] = [];
  students: any[] = [];

  selectedSchool: number | null = null;
  selectedYear: number | null = null;
  selectedGrade: number | null = null;
  selectedClass: number | null = null;

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.loadSchools();
  }

  // Load the list of schools
  loadSchools() {
    this.reportService.getSchools().subscribe(data => this.schools = data);
  }

  // Load years based on the selected school
  loadYears() {
    if (this.selectedSchool) {
      this.reportService.getYears(this.selectedSchool).subscribe(data => this.years = data);
    }
  }

  // Load grades based on the selected year
  loadGrades() {
    if (this.selectedYear) {
      this.reportService.getGrades(this.selectedYear).subscribe(data => this.grades = data);
    }
  }

  // Load classes based on the selected grade
  loadClasses() {
    if (this.selectedGrade) {
      this.reportService.getClasses(this.selectedGrade).subscribe(data => this.classes = data);
    }
  }

  // Load students based on the selected class
  loadStudents() {
    if (this.selectedClass) {
      this.reportService.getStudents(this.selectedClass).subscribe(data => this.students = data);
    }
  }

  // Get the name of the selected class
  getSelectedClassName(): string {
    if (!this.selectedClass || this.classes.length === 0) {
      return 'Not Selected';
    }

    // Find the selected class in the list
    const selectedClass = this.classes.find(c => c.id == this.selectedClass);
    return selectedClass ? selectedClass.name : 'Not Selected';
  }

  // Export students' data to Excel
  exportToExcel() {
    const worksheet = XLSX.utils.json_to_sheet(this.students);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students Report');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    saveAs(data, 'Students_Report.xlsx');
  }

  // Export students' data to PDF
  exportToPDF() {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Title and additional details
    const studentCountText = ` Number of Students: ${this.students.length}`;
    const classNameText = ` Class: ${this.getSelectedClassName()}`; // Include class name

    // Add report title
    doc.setFontSize(16);
    doc.text(' Student Report', 14, 15);

    // Add student count and class name
    doc.setFontSize(12);
    doc.text(studentCountText, 14, 25);
    doc.text(classNameText, 14, 32); //  Add class name below student count

    // Capture the table and convert it into an image
    const data = document.getElementById('studentsTable');
    if (data) {
      html2canvas(data, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        doc.addImage(imgData, 'PNG', 10, 40, imgWidth, imgHeight); // Shift the table slightly downward
        doc.save('Students_Report.pdf');
      });
    }
  } 
}
