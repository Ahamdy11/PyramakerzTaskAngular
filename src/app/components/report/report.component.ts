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
  selectedSchoolLogo: string = '';
  currentDate: string = '';

  selectedSchool: number | null = null;
  selectedYear: number | null = null;
  selectedGrade: number | null = null;
  selectedClass: number | null = null;

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.loadSchools();
    this.setCurrentDate();
  }

  // Load the list of schools
  loadSchools() {
    this.reportService.getSchools().subscribe(data => {
      this.schools = data;
    });
  }

  // Set the current date
  setCurrentDate(): void {
    const today = new Date();
    this.currentDate = today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Load the selected school's logo
  loadSchoolLogo() {
    if (this.selectedSchool) {
      const school = this.schools.find(s => s.id === this.selectedSchool);
      if (school) {
        this.selectedSchoolLogo = school.logo.trim();
      }
    }
  }

  // Load years based on the selected school
  loadYears() {
    if (this.selectedSchool) {
      this.loadSchoolLogo(); // Load logo when school changes
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
      this.reportService.getStudents(this.selectedClass).subscribe(data => {
        this.students = data;
        this.loadSchoolLogo();
      });
    }
  }

  // Get the name of the selected class
  getSelectedClassName(): string {
    if (!this.selectedClass || this.classes.length === 0) {
      return 'Not Selected';
    }
    const selectedClass = this.classes.find(c => c.id == this.selectedClass);
    return selectedClass ? selectedClass.name : 'Not Selected';
  }

  // Export students data to Excel
  exportToExcel() {
    const filteredData = this.students.map((student, index) => ({
      NO: index + 1, 
      Name: student.fullName, 
      Mobile: student.mobile, 
      Nationality: student.nationality, 
      Gender: student.gender
    }));

    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const header = ['NO', 'Name', 'Mobile', 'Nationality', 'Gender'];
    XLSX.utils.sheet_add_aoa(worksheet, [header], { origin: "A1" });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students Report');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    saveAs(data, 'Students_Report.xlsx');
  }

  // Export students data to PDF
  exportToPDF() {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Load logo and then add table
    this.loadLogo().then(imgData => {
      doc.addImage(imgData, 'PNG', 80, 10, 50, 20); 
      this.addTableToPDF(doc);
    }).catch(() => {
      console.error("❌ Failed to load logo.");
      this.addTableToPDF(doc); 
    });
  }

  // Convert logo to Base64 for PDF inclusion
  private loadLogo(): Promise<string> {
    return new Promise((resolve, reject) => {
      const imgElement = document.createElement("img");
      imgElement.src = "assets/images/Logo.png";
      imgElement.crossOrigin = "Anonymous"; 

      imgElement.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = imgElement.width;
        canvas.height = imgElement.height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(imgElement, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          reject("❌ Failed to load image.");
        }
      };

      imgElement.onerror = reject;
    });
  }

  // Add only the table below the logo
  private addTableToPDF(doc: jsPDF) {
    const data = document.getElementById('studentsTable');
    if (data) {
      html2canvas(data, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        doc.addImage(imgData, 'PNG', 10, 40, imgWidth, imgHeight); 
        doc.save('Students_Report.pdf');
      });
    }
  }

  // Print student report with full styles
  exportToPrint() {
    const printContents = document.getElementById('reportContent')?.innerHTML;
    if (printContents) {
      const printWindow = window.open('', '', 'width=900,height=600');

      // Load all styles from SCSS
      const styles = Array.from(document.styleSheets)
        .map(sheet => {
          try {
            return Array.from(sheet.cssRules)
              .map(rule => rule.cssText)
              .join("\n");
          } catch (e) {
            return "";
          }
        })
        .join("\n");

      printWindow?.document.write(`
        <html>
          <head>
            <title>Student Report</title>
            <style>${styles}</style>
          </head>
          <body onload="window.print(); window.close();">
            ${printContents}
          </body>
        </html>
      `);

      printWindow?.document.close();
    }
  }
}
