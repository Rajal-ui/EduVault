-- ============================================================
-- EduVault — Database Setup
-- Run this file in MySQL Workbench or via: mysql -u root -p < setup.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS bvp_student_office;
USE bvp_student_office;

DROP TABLE IF EXISTS MiscellaneousRecords;
DROP TABLE IF EXISTS ExamStatus;
DROP TABLE IF EXISTS FeeReceipts;
DROP TABLE IF EXISTS Marksheets;
DROP TABLE IF EXISTS Students;
DROP TABLE IF EXISTS Admins;

-- Admins
CREATE TABLE Admins (
    AdminID VARCHAR(20) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Department VARCHAR(50),
    Contact VARCHAR(100),
    Password VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Students
CREATE TABLE Students (
    StudentID VARCHAR(20) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Department VARCHAR(50) NOT NULL,
    Year INT NOT NULL CHECK (Year >= 1 AND Year <= 4),
    Contact VARCHAR(100),
    AcademicRecord TEXT,
    FeeStatus ENUM('Paid', 'Pending', 'Overdue') DEFAULT 'Pending',
    Password VARCHAR(255) NOT NULL,
    DateOfBirth DATE,
    Address VARCHAR(255),
    ParentContact VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Marksheets
CREATE TABLE Marksheets (
    StudentID VARCHAR(20) NOT NULL,
    Subject VARCHAR(100) NOT NULL,
    Marks INT NOT NULL,
    Grade VARCHAR(5) NOT NULL,
    PRIMARY KEY (StudentID, Subject),
    FOREIGN KEY (StudentID) REFERENCES Students(StudentID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Exam Status
CREATE TABLE ExamStatus (
    ExamRecordID INT AUTO_INCREMENT PRIMARY KEY,
    StudentID VARCHAR(20) NOT NULL,
    Semester VARCHAR(20) NOT NULL,
    GPA DECIMAL(3,2) NOT NULL,
    ResultStatus ENUM('Pass', 'Fail', 'ATKT', 'Distinction') DEFAULT 'Pass',
    DateReleased DATE NOT NULL,
    UNIQUE KEY unique_exam (StudentID, Semester),
    FOREIGN KEY (StudentID) REFERENCES Students(StudentID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fee Receipts
CREATE TABLE FeeReceipts (
    ReceiptID VARCHAR(20) PRIMARY KEY,
    StudentID VARCHAR(20) NOT NULL,
    FeeType VARCHAR(50) NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    PaidOn DATE NOT NULL,
    TransactionDetails TEXT,
    Status ENUM('Paid', 'Refunded', 'Cancelled') DEFAULT 'Paid',
    FOREIGN KEY (StudentID) REFERENCES Students(StudentID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Miscellaneous Records
CREATE TABLE MiscellaneousRecords (
    RecordID INT AUTO_INCREMENT PRIMARY KEY,
    StudentID VARCHAR(20) NOT NULL,
    RecordType ENUM('Warning', 'Attendance', 'Leave', 'General') DEFAULT 'General',
    Details TEXT NOT NULL,
    RecordedBy VARCHAR(100) NOT NULL,
    RecordedOn DATETIME NOT NULL,
    FOREIGN KEY (StudentID) REFERENCES Students(StudentID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Sample Data
-- NOTE: Passwords below are bcrypt hashed.
-- Admin login:   ADM001 / adminpass
-- Student login: STU001 / studpass  |  STU002 / studpass2
-- ============================================================

INSERT INTO Admins (AdminID, Name, Department, Contact, Password) VALUES
('ADM001', 'Mrs. Sakshi Patil', 'Head Office', 'sakshi.patil@college.edu',
 '$2b$12$KIXCqfTa0z5R8e/WnIQBpOgMzDhT9N0V6kL3YfJpX1sWqRnMvOuCi');

INSERT INTO Students (StudentID, Name, Department, Year, Contact, AcademicRecord, FeeStatus, Password, DateOfBirth, Address, ParentContact) VALUES
('STU001', 'Rajal Mistry', 'Computer Science', 2, 'rajal@email.com',
 'Excellent academic performance, no disciplinary issues.', 'Paid',
 '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 '2004-05-15', '123 Main St, Anytown', '555-1234'),
('STU002', 'Kaavya Sarin', 'Electronics Engineering', 3, 'kaavya@email.com',
 'Good standing, participated in tech fests.', 'Pending',
 '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 '2003-11-20', '456 Oak Ave, Othercity', '555-5678');

INSERT INTO Marksheets (StudentID, Subject, Marks, Grade) VALUES
('STU001', 'Mathematics', 85, 'B'),
('STU001', 'Physics', 92, 'A'),
('STU001', 'Programming', 78, 'A'),
('STU002', 'Mathematics', 90, 'B'),
('STU002', 'Physics', 92, 'A'),
('STU002', 'Programming', 98, 'C');

INSERT INTO FeeReceipts (ReceiptID, StudentID, FeeType, Amount, PaidOn, TransactionDetails, Status) VALUES
('REC001', 'STU001', 'Tuition Fee - Year 2', 5000.00, '2023-09-01', 'Annual Tuition Fee Payment via Online Banking', 'Paid'),
('REC002', 'STU001', 'Exam Fee - Sem 3', 500.00, '2024-01-10', 'Semester 3 Exam registration fee', 'Paid');

INSERT INTO ExamStatus (StudentID, Semester, GPA, ResultStatus, DateReleased) VALUES
('STU001', 'Semester 3', 8.95, 'Distinction', '2024-03-01'),
('STU002', 'Semester 5', 7.50, 'Pass', '2024-03-01');

INSERT INTO MiscellaneousRecords (StudentID, RecordType, Details, RecordedBy, RecordedOn) VALUES
('STU002', 'Warning', 'Late submission of project report after multiple reminders.', 'ADM001', NOW()),
('STU001', 'Leave', 'Approved medical leave for 5 days (Jan 15-19, 2024).', 'ADM001', NOW());
