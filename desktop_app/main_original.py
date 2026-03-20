import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import mysql.connector
from datetime import datetime
import hashlib

class DatabaseConnection:
    """Handles MySQL database connections"""
    
    @staticmethod
    def get_connection():
        try:
            conn = mysql.connector.connect(
                host="localhost",
                user="root", 
                password="Rajal_mysql!", 
                database="bvp_student_office"
            )
            return conn
        except mysql.connector.Error as err:
            messagebox.showerror("Database Error", f"Error connecting to database: {err}")
            return None


# Helper Windows for Admin Operations

class AddStudentWindow:
    def __init__(self, parent, callback):
        self.callback = callback
        self.window = tk.Toplevel(parent)
        self.window.title("Add New Student")
        self.window.geometry("500x650")
        self.window.resizable(False, False)
        
        main_frame = tk.Frame(self.window, bg="white", padx=30, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        tk.Label(main_frame, text="Add New Student", font=("Arial", 16, "bold"), 
                bg="white").grid(row=0, column=0, columnspan=2, pady=15)
        
        fields = [
            ("Student ID:", "student_id"),
            ("Name:", "name"),
            ("Department:", "department"),
            ("Year:", "year"),
            ("Contact:", "contact"),
            ("Date of Birth (YYYY-MM-DD):", "dob"),
            ("Address:", "address"),
            ("Parent Contact:", "parent_contact"),
            ("Password:", "password"),
        ]
        
        self.entries = {}
        
        for i, (label, key) in enumerate(fields, start=1):
            tk.Label(main_frame, text=label, font=("Arial", 11), 
                    bg="white").grid(row=i, column=0, sticky="w", pady=8)
            
            if key == "year":
                self.entries[key] = ttk.Combobox(main_frame, values=["1", "2", "3", "4"], 
                                                 width=27, state="readonly")
                self.entries[key].set("1")
            elif key == "address":
                self.entries[key] = tk.Text(main_frame, width=30, height=3, font=("Arial", 10))
            else:
                self.entries[key] = tk.Entry(main_frame, font=("Arial", 10), width=30)
            
            if key == "address":
                self.entries[key].grid(row=i, column=1, pady=8, padx=10)
            else:
                self.entries[key].grid(row=i, column=1, pady=8, padx=10)
        
        # Fee Status
        tk.Label(main_frame, text="Fee Status:", font=("Arial", 11), 
                bg="white").grid(row=len(fields)+1, column=0, sticky="w", pady=8)
        self.fee_status = ttk.Combobox(main_frame, values=['Paid', 'Pending', 'Overdue'], 
                                       width=27, state="readonly")
        self.fee_status.set('Pending')
        self.fee_status.grid(row=len(fields)+1, column=1, pady=8, padx=10)
        
        # Academic Record
        tk.Label(main_frame, text="Academic Record:", font=("Arial", 11), 
                bg="white").grid(row=len(fields)+2, column=0, sticky="nw", pady=8)
        self.academic_record = tk.Text(main_frame, width=30, height=3, font=("Arial", 10))
        self.academic_record.grid(row=len(fields)+2, column=1, pady=8, padx=10)
        
        # Buttons
        btn_frame = tk.Frame(main_frame, bg="white")
        btn_frame.pack(pady=20)
        
        tk.Button(btn_frame, text="Add", command=self.add_student,
                 bg="#27ae60", fg="white", font=("Arial", 11, "bold"), 
                 width=12).pack(side=tk.LEFT, padx=10)
        tk.Button(btn_frame, text="Cancel", command=self.window.destroy,
                 bg="#95a5a6", fg="white", font=("Arial", 11, "bold"), 
                 width=12).pack(side=tk.LEFT, padx=10)
    
    
    def add_student(self):
        student_id = self.entries['student_id'].get().strip()
        name = self.entries['name'].get().strip()
        department = self.entries['department'].get().strip()
        year = self.entries['year'].get()
        contact = self.entries['contact'].get().strip()
        dob = self.entries['dob'].get().strip()
        address = self.entries['address'].get("1.0", tk.END).strip()
        parent_contact = self.entries['parent_contact'].get().strip()
        password = self.entries['password'].get().strip()
        fee_status = self.fee_status.get()
        academic_record = self.academic_record.get("1.0", tk.END).strip()
        
        if not all([student_id, name, department, year, password]):
            messagebox.showerror("Error", "Please fill all required fields")
            return
        
        conn = DatabaseConnection.get_connection()
        if conn:
            cursor = conn.cursor()
            try:
                cursor.execute("""INSERT INTO Students 
                               (StudentID, Name, Department, Year, Contact, AcademicRecord, 
                                FeeStatus, Password, DateOfBirth, Address, ParentContact) 
                               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                             (student_id, name, department, year, contact, academic_record,
                              fee_status, password, dob or None, address or None, 
                              parent_contact or None))
                conn.commit()
                messagebox.showinfo("Success", "Student added successfully")
                self.callback()
                self.window.destroy()
            except mysql.connector.Error as err:
                messagebox.showerror("Error", f"Failed to add student: {err}")
            finally:
                cursor.close()
                conn.close()

class UpdateStudentWindow:
    def __init__(self, parent, student_id, callback):
        self.student_id = student_id
        self.callback = callback
        self.window = tk.Toplevel(parent)
        self.window.title("Update Student")
        self.window.geometry("500x650")
        self.window.resizable(False, False)
        
        # Fetch student data
        conn = DatabaseConnection.get_connection()
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM Students WHERE StudentID = %s", (student_id,))
            self.student_data = cursor.fetchone()
            cursor.close()
            conn.close()
        
        if not self.student_data:
            messagebox.showerror("Error", "Student not found")
            self.window.destroy()
            return
        
        main_frame = tk.Frame(self.window, bg="white", padx=30, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        tk.Label(main_frame, text=f"Update Student: {student_id}", 
                font=("Arial", 16, "bold"), bg="white").grid(row=0, column=0, 
                                                              columnspan=2, pady=15)
        
        fields = [
            ("Name:", "Name"),
            ("Department:", "Department"),
            ("Year:", "Year"),
            ("Contact:", "Contact"),
            ("Date of Birth (YYYY-MM-DD):", "DateOfBirth"),
            ("Address:", "Address"),
            ("Parent Contact:", "ParentContact"),
        ]
        
        self.entries = {}
        
        for i, (label, key) in enumerate(fields, start=1):
            tk.Label(main_frame, text=label, font=("Arial", 11), 
                    bg="white").grid(row=i, column=0, sticky="w", pady=8)
            
            if key == "Year":
                self.entries[key] = ttk.Combobox(main_frame, values=["1", "2", "3", "4"], 
                                                 width=27, state="readonly")
                self.entries[key].set(self.student_data[key])
            elif key in ["Address"]:
                self.entries[key] = tk.Text(main_frame, width=30, height=3, font=("Arial", 10))
                self.entries[key].insert("1.0", self.student_data[key] or "")
            else:
                self.entries[key] = tk.Entry(main_frame, font=("Arial", 10), width=30)
                self.entries[key].insert(0, self.student_data[key] or "")
            
            if key in ["Address"]:
                self.entries[key].grid(row=i, column=1, pady=8, padx=10)
            else:
                self.entries[key].grid(row=i, column=1, pady=8, padx=10)
        
        # Fee Status
        tk.Label(main_frame, text="Fee Status:", font=("Arial", 11), 
                bg="white").grid(row=len(fields)+1, column=0, sticky="w", pady=8)
        self.fee_status = ttk.Combobox(main_frame, values=['Paid', 'Pending', 'Overdue'], 
                                       width=27, state="readonly")
        self.fee_status.set(self.student_data['FeeStatus'])
        self.fee_status.grid(row=len(fields)+1, column=1, pady=8, padx=10)
        
        # Academic Record
        tk.Label(main_frame, text="Academic Record:", font=("Arial", 11), 
                bg="white").grid(row=len(fields)+2, column=0, sticky="nw", pady=8)
        self.academic_record = tk.Text(main_frame, width=30, height=3, font=("Arial", 10))
        self.academic_record.insert("1.0", self.student_data['AcademicRecord'] or "")
        self.academic_record.grid(row=len(fields)+2, column=1, pady=8, padx=10)
        
        # Buttons
        btn_frame = tk.Frame(main_frame, bg="white")
        btn_frame.grid(row=len(fields)+3, column=0, columnspan=2, pady=20)
        
        tk.Button(btn_frame, text="Update", command=self.update_student,
                 bg="#f39c12", fg="white", font=("Arial", 11, "bold"), 
                 width=15).pack(side=tk.LEFT, padx=10)
        tk.Button(btn_frame, text="Cancel", command=self.window.destroy,
                 bg="#95a5a6", fg="white", font=("Arial", 11, "bold"), 
                 width=15).pack(side=tk.LEFT, padx=10)
    
    def update_student(self):
        name = self.entries['Name'].get().strip()
        department = self.entries['Department'].get().strip()
        year = self.entries['Year'].get()
        contact = self.entries['Contact'].get().strip()
        dob = self.entries['DateOfBirth'].get().strip()
        address = self.entries['Address'].get("1.0", tk.END).strip()
        parent_contact = self.entries['ParentContact'].get().strip()
        fee_status = self.fee_status.get()
        academic_record = self.academic_record.get("1.0", tk.END).strip()
        
        conn = DatabaseConnection.get_connection()
        if conn:
            cursor = conn.cursor()
            try:
                cursor.execute("""UPDATE Students SET Name=%s, Department=%s, Year=%s, 
                               Contact=%s, DateOfBirth=%s, Address=%s, ParentContact=%s,
                               FeeStatus=%s, AcademicRecord=%s WHERE StudentID=%s""",
                             (name, department, year, contact, dob or None, 
                              address or None, parent_contact or None, fee_status, 
                              academic_record, self.student_id))
                conn.commit()
                messagebox.showinfo("Success", "Student updated successfully")
                self.callback()
                self.window.destroy()
            except mysql.connector.Error as err:
                messagebox.showerror("Error", f"Failed to update: {err}")
            finally:
                cursor.close()
                conn.close()

class AddMarksWindow:
    def __init__(self, parent, callback):
        self.callback = callback
        self.window = tk.Toplevel(parent)
        self.window.title("Add Marks")
        self.window.geometry("400x350")
        self.window.resizable(False, False)
        
        main_frame = tk.Frame(self.window, bg="white", padx=30, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        tk.Label(main_frame, text="Add Marks", font=("Arial", 16, "bold"), 
                bg="white").pack(pady=15)
        
        # Student ID
        tk.Label(main_frame, text="Student ID:", font=("Arial", 11), 
                bg="white").pack(anchor="w", pady=5)
        self.student_id = tk.Entry(main_frame, font=("Arial", 10), width=30)
        self.student_id.pack(pady=5)
        
        # Subject
        tk.Label(main_frame, text="Subject:", font=("Arial", 11), 
                bg="white").pack(anchor="w", pady=5)
        self.subject = tk.Entry(main_frame, font=("Arial", 10), width=30)
        self.subject.pack(pady=5)
        
        # Marks
        tk.Label(main_frame, text="Marks:", font=("Arial", 11), 
                bg="white").pack(anchor="w", pady=5)
        self.marks = tk.Entry(main_frame, font=("Arial", 10), width=30)
        self.marks.pack(pady=5)
        
        # Grade
        tk.Label(main_frame, text="Grade:", font=("Arial", 11), 
                bg="white").pack(anchor="w", pady=5)
        self.grade = ttk.Combobox(main_frame, values=['A', 'B', 'C', 'D', 'F'], 
                                  width=28, state="readonly")
        self.grade.set('A')
        self.grade.pack(pady=5)
        
        # Buttons
        btn_frame = tk.Frame(main_frame, bg="white")
        btn_frame.pack(pady=20)
        
        tk.Button(btn_frame, text="Add", command=self.add_marks,
                 bg="#27ae60", fg="white", font=("Arial", 11, "bold"), 
                 width=12).pack(side=tk.LEFT, padx=10)
        tk.Button(btn_frame, text="Cancel", command=self.window.destroy,
                 bg="#95a5a6", fg="white", font=("Arial", 11, "bold"), 
                 width=12).pack(side=tk.LEFT, padx=10)
    
    def add_marks(self):
        student_id = self.student_id.get().strip()
        subject = self.subject.get().strip()
        marks = self.marks.get().strip()
        grade = self.grade.get()
        
        if not all([student_id, subject, marks, grade]):
            messagebox.showerror("Error", "Please fill all fields")
            return
        
        try:
            marks = int(marks)
            if marks < 0 or marks > 100:
                messagebox.showerror("Error", "Marks must be between 0 and 100")
                return
        except ValueError:
            messagebox.showerror("Error", "Marks must be a number")
            return
        
        conn = DatabaseConnection.get_connection()
        if conn:
            cursor = conn.cursor()
            try:
                cursor.execute("""INSERT INTO Marksheets (StudentID, Subject, Marks, Grade) 
                               VALUES (%s, %s, %s, %s)""",
                             (student_id, subject, marks, grade))
                conn.commit()
                messagebox.showinfo("Success", "Marks added successfully")
                self.callback()
                self.window.destroy()
            except mysql.connector.Error as err:
                messagebox.showerror("Error", f"Failed to add marks: {err}")
            finally:
                cursor.close()
                conn.close()

class AddFeeReceiptWindow:
    def __init__(self, parent, callback):
        self.callback = callback
        self.window = tk.Toplevel(parent)
        self.window.title("Add Fee Receipt")
        self.window.geometry("450x450")
        self.window.resizable(False, False)
        
        main_frame = tk.Frame(self.window, bg="white", padx=30, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        tk.Label(main_frame, text="Add Fee Receipt", font=("Arial", 16, "bold"), 
                bg="white").pack(pady=15)
        
        fields = [
            ("Receipt ID:", "receipt_id"),
            ("Student ID:", "student_id"),
            ("Fee Type:", "fee_type"),
            ("Amount:", "amount"),
            ("Paid On (YYYY-MM-DD):", "paid_on"),
        ]
        
        self.entries = {}
        
        for label, key in fields:
            tk.Label(main_frame, text=label, font=("Arial", 11), 
                    bg="white").pack(anchor="w", pady=5)
            self.entries[key] = tk.Entry(main_frame, font=("Arial", 10), width=35)
            self.entries[key].pack(pady=5)
        
        # Transaction Details
        tk.Label(main_frame, text="Transaction Details:", font=("Arial", 11), 
                bg="white").pack(anchor="w", pady=5)
        self.transaction_details = tk.Text(main_frame, width=35, height=3, font=("Arial", 10))
        self.transaction_details.pack(pady=5)
        
        # Status
        tk.Label(main_frame, text="Status:", font=("Arial", 11), 
                bg="white").pack(anchor="w", pady=5)
        self.status = ttk.Combobox(main_frame, values=['Paid', 'Refunded', 'Cancelled'], 
                                   width=33, state="readonly")
        self.status.set('Paid')
        self.status.pack(pady=5)
        
        # Buttons
        btn_frame = tk.Frame(main_frame, bg="white")
        btn_frame.pack(pady=20)
        
        tk.Button(btn_frame, text="Add", command=self.add_receipt,
                 bg="#27ae60", fg="white", font=("Arial", 11, "bold"), 
                 width=12).pack(side=tk.LEFT, padx=10)
        tk.Button(btn_frame, text="Cancel", command=self.window.destroy,
                 bg="#95a5a6", fg="white", font=("Arial", 11, "bold"), 
                 width=12).pack(side=tk.LEFT, padx=10)
    
    def add_receipt(self):
        receipt_id = self.entries['receipt_id'].get().strip()
        student_id = self.entries['student_id'].get().strip()
        fee_type = self.entries['fee_type'].get().strip()
        amount = self.entries['amount'].get().strip()
        paid_on = self.entries['paid_on'].get().strip()
        transaction_details = self.transaction_details.get("1.0", tk.END).strip()
        status = self.status.get()
        
        if not all([receipt_id, student_id, fee_type, amount, paid_on]):
            messagebox.showerror("Error", "Please fill all required fields")
            return
        
        conn = DatabaseConnection.get_connection()
        if conn:
            cursor = conn.cursor()
            try:
                cursor.execute("""INSERT INTO FeeReceipts 
                               (ReceiptID, StudentID, FeeType, Amount, PaidOn, 
                                TransactionDetails, Status) 
                               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                             (receipt_id, student_id, fee_type, amount, paid_on, 
                              transaction_details, status))
                conn.commit()
                messagebox.showinfo("Success", "Fee receipt added successfully")
                self.callback()
                self.window.destroy()
            except mysql.connector.Error as err:
                messagebox.showerror("Error", f"Failed to add receipt: {err}")
            finally:
                cursor.close()
                conn.close()

class AddExamResultWindow:
    def __init__(self, parent, callback):
        self.callback = callback
        self.window = tk.Toplevel(parent)
        self.window.title("Add Exam Result")
        self.window.geometry("400x400")
        self.window.resizable(False, False)
        
        main_frame = tk.Frame(self.window, bg="white", padx=30, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        tk.Label(main_frame, text="Add Exam Result", font=("Arial", 16, "bold"), 
                bg="white").pack(pady=15)
        
        # Student ID
        tk.Label(main_frame, text="Student ID:", font=("Arial", 11), 
                bg="white").pack(anchor="w", pady=5)
        self.student_id = tk.Entry(main_frame, font=("Arial", 10), width=30)
        self.student_id.pack(pady=5)
        
        # Semester
        tk.Label(main_frame, text="Semester:", font=("Arial", 11), 
                bg="white").pack(anchor="w", pady=5)
        self.semester = tk.Entry(main_frame, font=("Arial", 10), width=30)
        self.semester.pack(pady=5)
        
        # GPA
        tk.Label(main_frame, text="GPA (0.00-10.00):", font=("Arial", 11), 
                bg="white").pack(anchor="w", pady=5)
        self.gpa = tk.Entry(main_frame, font=("Arial", 10), width=30)
        self.gpa.pack(pady=5)
        
        # Result Status
        tk.Label(main_frame, text="Result Status:", font=("Arial", 11), 
                bg="white").pack(anchor="w", pady=5)
        self.result_status = ttk.Combobox(main_frame, 
                                          values=['Pass', 'Fail', 'ATKT', 'Distinction'], 
                                          width=28, state="readonly")
        self.result_status.set('Pass')
        self.result_status.pack(pady=5)
        
        # Date Released
        tk.Label(main_frame, text="Date Released (YYYY-MM-DD):", font=("Arial", 11), 
                bg="white").pack(anchor="w", pady=5)
        self.date_released = tk.Entry(main_frame, font=("Arial", 10), width=30)
        self.date_released.pack(pady=5)
        
        # Buttons
        btn_frame = tk.Frame(main_frame, bg="white")
        btn_frame.pack(pady=20)
        
        tk.Button(btn_frame, text="Add", command=self.add_result,
                 bg="#27ae60", fg="white", font=("Arial", 11, "bold"), 
                 width=12).pack(side=tk.LEFT, padx=10)
        tk.Button(btn_frame, text="Cancel", command=self.window.destroy,
                 bg="#95a5a6", fg="white", font=("Arial", 11, "bold"), 
                 width=12).pack(side=tk.LEFT, padx=10)
    
    def add_result(self):
        student_id = self.student_id.get().strip()
        semester = self.semester.get().strip()
        gpa = self.gpa.get().strip()
        result_status = self.result_status.get()
        date_released = self.date_released.get().strip()
        
        if not all([student_id, semester, gpa, result_status, date_released]):
            messagebox.showerror("Error", "Please fill all fields")
            return
        
        conn = DatabaseConnection.get_connection()
        if conn:
            cursor = conn.cursor()
            try:
                cursor.execute("""INSERT INTO ExamStatus 
                               (StudentID, Semester, GPA, ResultStatus, DateReleased) 
                               VALUES (%s, %s, %s, %s, %s)""",
                             (student_id, semester, gpa, result_status, date_released))
                conn.commit()
                messagebox.showinfo("Success", "Exam result added successfully")
                self.callback()
                self.window.destroy()
            except mysql.connector.Error as err:
                messagebox.showerror("Error", f"Failed to add result: {err}")
            finally:
                cursor.close()
                conn.close()

class AddMiscRecordWindow:
    def __init__(self, parent, admin_id, callback):
        self.admin_id = admin_id
        self.callback = callback
        self.window = tk.Toplevel(parent)
        self.window.title("Add Miscellaneous Record")
        self.window.geometry("450x400")
        self.window.resizable(False, False)
        
        main_frame = tk.Frame(self.window, bg="white", padx=30, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        tk.Label(main_frame, text="Add Miscellaneous Record", font=("Arial", 16, "bold"), 
                bg="white").pack(pady=15)
        
        # Student ID
        tk.Label(main_frame, text="Student ID:", font=("Arial", 11), 
                bg="white").pack(anchor="w", pady=5)
        self.student_id = tk.Entry(main_frame, font=("Arial", 10), width=35)
        self.student_id.pack(pady=5)
        
        # Record Type
        tk.Label(main_frame, text="Record Type:", font=("Arial", 11), 
                bg="white").pack(anchor="w", pady=5)
        self.record_type = ttk.Combobox(main_frame, 
                                        values=['Warning', 'Attendance', 'Leave', 'General'], 
                                        width=33, state="readonly")
        self.record_type.set('General')
        self.record_type.pack(pady=5)
        
        # Details
        tk.Label(main_frame, text="Details:", font=("Arial", 11), 
                bg="white").pack(anchor="w", pady=5)
        self.details = tk.Text(main_frame, width=35, height=5, font=("Arial", 10))
        self.details.pack(pady=5)
        
        # Buttons
        btn_frame = tk.Frame(main_frame, bg="white")
        btn_frame.pack(pady=15)
        tk.Button(
            btn_frame,
            text="Add",
            command=self.add_record,
            bg="#27ae60",
            fg="white",
            font=("Arial", 11, "bold"),
            width=12,
        ).pack(side=tk.LEFT, padx=10)
        tk.Button(
            btn_frame,
            text="Cancel",
            command=self.window.destroy,
            bg="#95a5a6",
            fg="white",
            font=("Arial", 11, "bold"),
            width=12,
        ).pack(side=tk.LEFT, padx=10)

    def add_record(self):
        student_id = self.student_id.get().strip()
        record_type = self.record_type.get()
        details = self.details.get("1.0", tk.END).strip()

        if not all([student_id, record_type, details]):
            messagebox.showerror("Error", "Please fill all fields")
            return

        conn = DatabaseConnection.get_connection()
        if not conn:
            return
        cursor = conn.cursor()
        try:
            cursor.execute(
                """INSERT INTO MiscellaneousRecords 
                               (StudentID, RecordType, Details, RecordedBy, RecordedOn) 
                               VALUES (%s, %s, %s, %s, NOW())""",
                (student_id, record_type, details, self.admin_id),
            )
            conn.commit()
            messagebox.showinfo("Success", "Record added successfully")
            self.callback()
            self.window.destroy()
        except mysql.connector.Error as err:
            messagebox.showerror("Error", f"Failed to add record: {err}")
        finally:
            cursor.close()
            conn.close()


class StudentDashboard:
    """Student dashboard to view personal information"""
    
    def __init__(self, root, student_data):
        self.root = root
        self.student_data = student_data
        self.root.title(f"Student Dashboard - {student_data['Name']}")
        self.root.geometry("900x700")
        
        # Header
        header = tk.Frame(root, bg="#3498db", height=80)
        header.pack(fill=tk.X)
        
        tk.Label(header, text=f"Welcome, {student_data['Name']}", 
                font=("Arial", 20, "bold"), bg="#3498db", fg="white").pack(pady=20)
        
        logout_btn = tk.Button(header, text="Logout", command=self.logout,
                              bg="#e74c3c", fg="white", font=("Arial", 10, "bold"))
        logout_btn.place(relx=0.95, rely=0.5, anchor="e")
        
        # Notebook for tabs
        self.notebook = ttk.Notebook(root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Create tabs
        self.create_profile_tab()
        self.create_marksheet_tab()
        self.create_fee_receipts_tab()
        self.create_exam_status_tab()
        self.create_misc_records_tab()
    
    def create_profile_tab(self):
        profile_frame = tk.Frame(self.notebook, bg="white")
        self.notebook.add(profile_frame, text="Profile")
        
        # Info frame
        info_frame = tk.Frame(profile_frame, bg="white", padx=30, pady=30)
        info_frame.pack(fill=tk.BOTH, expand=True)
        
        tk.Label(info_frame, text="Personal Information", 
                font=("Arial", 18, "bold"), bg="white").grid(row=0, column=0, 
                                                              columnspan=2, pady=20)
        
        fields = [
            ("Student ID:", self.student_data['StudentID']),
            ("Name:", self.student_data['Name']),
            ("Department:", self.student_data['Department']),
            ("Year:", str(self.student_data['Year'])),
            ("Contact:", self.student_data['Contact']),
            ("Date of Birth:", str(self.student_data['DateOfBirth']) if self.student_data['DateOfBirth'] else "N/A"),
            ("Address:", self.student_data['Address'] if self.student_data['Address'] else "N/A"),
            ("Parent Contact:", self.student_data['ParentContact'] if self.student_data['ParentContact'] else "N/A"),
            ("Fee Status:", self.student_data['FeeStatus'])
        ]
        
        for i, (label, value) in enumerate(fields, start=1):
            tk.Label(info_frame, text=label, font=("Arial", 12, "bold"), 
                    bg="white").grid(row=i, column=0, sticky="w", pady=8, padx=10)
            tk.Label(info_frame, text=value, font=("Arial", 12), 
                    bg="white").grid(row=i, column=1, sticky="w", pady=8, padx=10)
        
        # Academic Record
        tk.Label(info_frame, text="Academic Record:", font=("Arial", 12, "bold"), 
                bg="white").grid(row=len(fields)+1, column=0, sticky="nw", pady=8, padx=10)
        
        record_text = scrolledtext.ScrolledText(info_frame, width=50, height=5, 
                                               font=("Arial", 10), wrap=tk.WORD)
        record_text.grid(row=len(fields)+1, column=1, pady=8, padx=10)
        record_text.insert(tk.END, self.student_data['AcademicRecord'] or "No records available")
        record_text.config(state=tk.DISABLED)
    
    def create_marksheet_tab(self):
        marks_frame = tk.Frame(self.notebook, bg="white")
        self.notebook.add(marks_frame, text="Marksheet")
        
        tk.Label(marks_frame, text="Your Marks", font=("Arial", 18, "bold"), 
                bg="white").pack(pady=20)
        
        # Treeview for marks
        tree_frame = tk.Frame(marks_frame, bg="white")
        tree_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        columns = ("Subject", "Marks", "Grade")
        tree = ttk.Treeview(tree_frame, columns=columns, show="headings", height=15)
        
        for col in columns:
            tree.heading(col, text=col)
            tree.column(col, anchor="center", width=200)
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=tree.yview)
        tree.configure(yscroll=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        tree.pack(fill=tk.BOTH, expand=True)
        
        # Fetch marks
        conn = DatabaseConnection.get_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("SELECT Subject, Marks, Grade FROM Marksheets WHERE StudentID = %s", 
                         (self.student_data['StudentID'],))
            marks = cursor.fetchall()
            
            for mark in marks:
                tree.insert("", tk.END, values=mark)
            
            cursor.close()
            conn.close()
    
    def create_fee_receipts_tab(self):
        fee_frame = tk.Frame(self.notebook, bg="white")
        self.notebook.add(fee_frame, text="Fee Receipts")
        
        tk.Label(fee_frame, text="Fee Payment History", font=("Arial", 18, "bold"), 
                bg="white").pack(pady=20)
        
        # Treeview for receipts
        tree_frame = tk.Frame(fee_frame, bg="white")
        tree_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        columns = ("Receipt ID", "Fee Type", "Amount", "Paid On", "Status")
        tree = ttk.Treeview(tree_frame, columns=columns, show="headings", height=15)
        
        tree.heading("Receipt ID", text="Receipt ID")
        tree.column("Receipt ID", anchor="center", width=120)
        tree.heading("Fee Type", text="Fee Type")
        tree.column("Fee Type", anchor="center", width=200)
        tree.heading("Amount", text="Amount (₹)")
        tree.column("Amount", anchor="center", width=120)
        tree.heading("Paid On", text="Paid On")
        tree.column("Paid On", anchor="center", width=120)
        tree.heading("Status", text="Status")
        tree.column("Status", anchor="center", width=100)
        
        scrollbar = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=tree.yview)
        tree.configure(yscroll=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        tree.pack(fill=tk.BOTH, expand=True)
        
        # Fetch receipts
        conn = DatabaseConnection.get_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("""SELECT ReceiptID, FeeType, Amount, PaidOn, Status 
                           FROM FeeReceipts WHERE StudentID = %s""", 
                         (self.student_data['StudentID'],))
            receipts = cursor.fetchall()
            
            for receipt in receipts:
                tree.insert("", tk.END, values=receipt)
            
            cursor.close()
            conn.close()
    
    def create_exam_status_tab(self):
        exam_frame = tk.Frame(self.notebook, bg="white")
        self.notebook.add(exam_frame, text="Exam Status")
        
        tk.Label(exam_frame, text="Examination Results", font=("Arial", 18, "bold"), 
                bg="white").pack(pady=20)
        
        tree_frame = tk.Frame(exam_frame, bg="white")
        tree_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        columns = ("Semester", "GPA", "Result", "Date Released")
        tree = ttk.Treeview(tree_frame, columns=columns, show="headings", height=15)
        
        for col in columns:
            tree.heading(col, text=col)
            tree.column(col, anchor="center", width=180)
        
        scrollbar = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=tree.yview)
        tree.configure(yscroll=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        tree.pack(fill=tk.BOTH, expand=True)
        
        conn = DatabaseConnection.get_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("""SELECT Semester, GPA, ResultStatus, DateReleased 
                           FROM ExamStatus WHERE StudentID = %s""", 
                         (self.student_data['StudentID'],))
            results = cursor.fetchall()
            
            for result in results:
                tree.insert("", tk.END, values=result)
            
            cursor.close()
            conn.close()
    
    def create_misc_records_tab(self):
        misc_frame = tk.Frame(self.notebook, bg="white")
        self.notebook.add(misc_frame, text="Other Records")
        
        tk.Label(misc_frame, text="Miscellaneous Records", font=("Arial", 18, "bold"), 
                bg="white").pack(pady=20)
        
        tree_frame = tk.Frame(misc_frame, bg="white")
        tree_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        columns = ("Type", "Details", "Recorded By", "Date")
        tree = ttk.Treeview(tree_frame, columns=columns, show="headings", height=15)
        
        tree.heading("Type", text="Record Type")
        tree.column("Type", anchor="center", width=120)
        tree.heading("Details", text="Details")
        tree.column("Details", anchor="w", width=350)
        tree.heading("Recorded By", text="Recorded By")
        tree.column("Recorded By", anchor="center", width=150)
        tree.heading("Date", text="Date")
        tree.column("Date", anchor="center", width=150)
        
        scrollbar = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=tree.yview)
        tree.configure(yscroll=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        tree.pack(fill=tk.BOTH, expand=True)
        
        conn = DatabaseConnection.get_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("""SELECT RecordType, Details, RecordedBy, RecordedOn 
                           FROM MiscellaneousRecords WHERE StudentID = %s""", 
                         (self.student_data['StudentID'],))
            records = cursor.fetchall()
            
            for record in records:
                tree.insert("", tk.END, values=record)
            
            cursor.close()
            conn.close()
    
    def logout(self):
        self.root.destroy()
        login_root = tk.Tk()
        LoginWindow(login_root)
        login_root.mainloop()


class AdminDashboard:
    """Admin dashboard with full CRUD operations"""
    
    def __init__(self, root, admin_data):
        self.root = root
        self.admin_data = admin_data
        self.root.title(f"Admin Dashboard - {admin_data['Name']}")
        self.root.geometry("1100x750")
        
        # Header
        header = tk.Frame(root, bg="#e74c3c", height=80)
        header.pack(fill=tk.X)
        
        tk.Label(header, text=f"Admin Panel - {admin_data['Name']}", 
                font=("Arial", 20, "bold"), bg="#e74c3c", fg="white").pack(pady=20)
        
        logout_btn = tk.Button(header, text="Logout", command=self.logout,
                              bg="#c0392b", fg="white", font=("Arial", 10, "bold"))
        logout_btn.place(relx=0.95, rely=0.5, anchor="e")
        
        # Notebook
        self.notebook = ttk.Notebook(root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Create tabs
        self.create_students_tab()
        self.create_marks_tab()
        self.create_fees_tab()
        self.create_exam_status_tab()
        self.create_misc_records_tab()
    
    def create_students_tab(self):
        students_frame = tk.Frame(self.notebook, bg="white")
        self.notebook.add(students_frame, text="Students Management")
        
        # Control buttons
        btn_frame = tk.Frame(students_frame, bg="white")
        btn_frame.pack(fill=tk.X, padx=20, pady=10)
        
        tk.Button(btn_frame, text="Add Student", command=self.add_student,
                 bg="#27ae60", fg="white", font=("Arial", 10, "bold")).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Update Student", command=self.update_student,
                 bg="#f39c12", fg="white", font=("Arial", 10, "bold")).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Delete Student", command=self.delete_student,
                 bg="#e74c3c", fg="white", font=("Arial", 10, "bold")).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Refresh", command=self.refresh_students,
                 bg="#3498db", fg="white", font=("Arial", 10, "bold")).pack(side=tk.LEFT, padx=5)
        
        # Treeview
        tree_frame = tk.Frame(students_frame, bg="white")
        tree_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        columns = ("ID", "Name", "Department", "Year", "Contact", "Fee Status")
        self.students_tree = ttk.Treeview(tree_frame, columns=columns, show="headings", height=20)
        
        for col in columns:
            self.students_tree.heading(col, text=col)
            self.students_tree.column(col, anchor="center", width=150)
        
        scrollbar = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=self.students_tree.yview)
        self.students_tree.configure(yscroll=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.students_tree.pack(fill=tk.BOTH, expand=True)
        
        self.refresh_students()
    
    def refresh_students(self):
        for item in self.students_tree.get_children():
            self.students_tree.delete(item)
        
        conn = DatabaseConnection.get_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("SELECT StudentID, Name, Department, Year, Contact, FeeStatus FROM Students")
            students = cursor.fetchall()
            
            for student in students:
                self.students_tree.insert("", tk.END, values=student)
            
            cursor.close()
            conn.close()
    
    def add_student(self):
        AddStudentWindow(self.root, self.refresh_students)
    
    def update_student(self):
        selected = self.students_tree.selection()
        if not selected:
            messagebox.showwarning("Warning", "Please select a student to update")
            return
        
        student_id = self.students_tree.item(selected[0])['values'][0]
        UpdateStudentWindow(self.root, student_id, self.refresh_students)
    
    def delete_student(self):
        selected = self.students_tree.selection()
        if not selected:
            messagebox.showwarning("Warning", "Please select a student to delete")
            return
        
        student_id = self.students_tree.item(selected[0])['values'][0]
        
        if messagebox.askyesno("Confirm Delete", f"Delete student {student_id}?"):
            conn = DatabaseConnection.get_connection()
            if conn:
                cursor = conn.cursor()
                try:
                    cursor.execute("DELETE FROM Students WHERE StudentID = %s", (student_id,))
                    conn.commit()
                    messagebox.showinfo("Success", "Student deleted successfully")
                    self.refresh_students()
                except mysql.connector.Error as err:
                    messagebox.showerror("Error", f"Failed to delete: {err}")
                finally:
                    cursor.close()
                    conn.close()
    
    def create_marks_tab(self):
        marks_frame = tk.Frame(self.notebook, bg="white")
        self.notebook.add(marks_frame, text="Marks Management")
        
        btn_frame = tk.Frame(marks_frame, bg="white")
        btn_frame.pack(fill=tk.X, padx=20, pady=10)
        
        tk.Button(btn_frame, text="Add Marks", command=self.add_marks,
                 bg="#27ae60", fg="white", font=("Arial", 10, "bold")).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Refresh", command=self.refresh_marks,
                 bg="#3498db", fg="white", font=("Arial", 10, "bold")).pack(side=tk.LEFT, padx=5)
        
        tree_frame = tk.Frame(marks_frame, bg="white")
        tree_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        columns = ("Student ID", "Subject", "Marks", "Grade")
        self.marks_tree = ttk.Treeview(tree_frame, columns=columns, show="headings", height=20)
        
        for col in columns:
            self.marks_tree.heading(col, text=col)
            self.marks_tree.column(col, anchor="center", width=200)
        
        scrollbar = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=self.marks_tree.yview)
        self.marks_tree.configure(yscroll=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.marks_tree.pack(fill=tk.BOTH, expand=True)
        
        self.refresh_marks()
    
    def refresh_marks(self):
        for item in self.marks_tree.get_children():
            self.marks_tree.delete(item)
        
        conn = DatabaseConnection.get_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("SELECT StudentID, Subject, Marks, Grade FROM Marksheets")
            marks = cursor.fetchall()
            
            for mark in marks:
                self.marks_tree.insert("", tk.END, values=mark)
            
            cursor.close()
            conn.close()
    
    def add_marks(self):
        AddMarksWindow(self.root, self.refresh_marks)
    
    def create_fees_tab(self):
        fees_frame = tk.Frame(self.notebook, bg="white")
        self.notebook.add(fees_frame, text="Fee Management")
        
        btn_frame = tk.Frame(fees_frame, bg="white")
        btn_frame.pack(fill=tk.X, padx=20, pady=10)
        
        tk.Button(btn_frame, text="Add Fee Receipt", command=self.add_fee_receipt,
                 bg="#27ae60", fg="white", font=("Arial", 10, "bold")).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Refresh", command=self.refresh_fees,
                 bg="#3498db", fg="white", font=("Arial", 10, "bold")).pack(side=tk.LEFT, padx=5)
        
        tree_frame = tk.Frame(fees_frame, bg="white")
        tree_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        columns = ("Receipt ID", "Student ID", "Fee Type", "Amount", "Paid On", "Status")
        self.fees_tree = ttk.Treeview(tree_frame, columns=columns, show="headings", height=20)
        
        for col in columns:
            self.fees_tree.heading(col, text=col)
            self.fees_tree.column(col, anchor="center", width=150)
        
        scrollbar = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=self.fees_tree.yview)
        self.fees_tree.configure(yscroll=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.fees_tree.pack(fill=tk.BOTH, expand=True)
        
        self.refresh_fees()
    
    def refresh_fees(self):
        for item in self.fees_tree.get_children():
            self.fees_tree.delete(item)
        
        conn = DatabaseConnection.get_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("SELECT ReceiptID, StudentID, FeeType, Amount, PaidOn, Status FROM FeeReceipts")
            fees = cursor.fetchall()
            
            for fee in fees:
                self.fees_tree.insert("", tk.END, values=fee)
            
            cursor.close()
            conn.close()
    
    def add_fee_receipt(self):
        AddFeeReceiptWindow(self.root, self.refresh_fees)
    
    def create_exam_status_tab(self):
        exam_frame = tk.Frame(self.notebook, bg="white")
        self.notebook.add(exam_frame, text="Exam Status")
        
        btn_frame = tk.Frame(exam_frame, bg="white")
        btn_frame.pack(fill=tk.X, padx=20, pady=10)
        
        tk.Button(btn_frame, text="Add Exam Result", command=self.add_exam_result,
                 bg="#27ae60", fg="white", font=("Arial", 10, "bold")).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Refresh", command=self.refresh_exam_status,
                 bg="#3498db", fg="white", font=("Arial", 10, "bold")).pack(side=tk.LEFT, padx=5)
        
        tree_frame = tk.Frame(exam_frame, bg="white")
        tree_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        columns = ("Student ID", "Semester", "GPA", "Result", "Date Released")
        self.exam_tree = ttk.Treeview(tree_frame, columns=columns, show="headings", height=20)
        
        for col in columns:
            self.exam_tree.heading(col, text=col)
            self.exam_tree.column(col, anchor="center", width=180)
        
        scrollbar = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=self.exam_tree.yview)
        self.exam_tree.configure(yscroll=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.exam_tree.pack(fill=tk.BOTH, expand=True)
        
        self.refresh_exam_status()
    
    def refresh_exam_status(self):
        for item in self.exam_tree.get_children():
            self.exam_tree.delete(item)
        
        conn = DatabaseConnection.get_connection()
        if not conn:
            return
        cursor = conn.cursor()
        try:
            cursor.execute(
                "SELECT StudentID, Semester, GPA, ResultStatus, DateReleased FROM ExamStatus"
            )
            rows = cursor.fetchall()
            for row in rows:
                self.exam_tree.insert("", tk.END, values=row)
        finally:
            cursor.close()
            conn.close()
    
    def add_exam_result(self):
        AddExamResultWindow(self.root, self.refresh_exam_status)
    
    def create_misc_records_tab(self):
        misc_frame = tk.Frame(self.notebook, bg="white")
        self.notebook.add(misc_frame, text="Misc Records")
        
        btn_frame = tk.Frame(misc_frame, bg="white")
        btn_frame.pack(fill=tk.X, padx=20, pady=10)
        
        tk.Button(btn_frame, text="Add Record", command=self.add_misc_record,
                 bg="#27ae60", fg="white", font=("Arial", 10, "bold")).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Refresh", command=self.refresh_misc_records,
                 bg="#3498db", fg="white", font=("Arial", 10, "bold")).pack(side=tk.LEFT, padx=5)
        
        tree_frame = tk.Frame(misc_frame, bg="white")
        tree_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        columns = ("Record ID", "Student ID", "Type", "Details", "Recorded By", "Date")
        self.misc_tree = ttk.Treeview(tree_frame, columns=columns, show="headings", height=20)
        
        self.misc_tree.heading("Record ID", text="ID")
        self.misc_tree.column("Record ID", anchor="center", width=60)
        self.misc_tree.heading("Student ID", text="Student ID")
        self.misc_tree.column("Student ID", anchor="center", width=100)
        self.misc_tree.heading("Type", text="Type")
        self.misc_tree.column("Type", anchor="center", width=100)
        self.misc_tree.heading("Details", text="Details")
        self.misc_tree.column("Details", anchor="w", width=300)
        self.misc_tree.heading("Recorded By", text="Recorded By")
        self.misc_tree.column("Recorded By", anchor="center", width=120)
        self.misc_tree.heading("Date", text="Date")
        self.misc_tree.column("Date", anchor="center", width=150)
        
        scrollbar = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=self.misc_tree.yview)
        self.misc_tree.configure(yscroll=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.misc_tree.pack(fill=tk.BOTH, expand=True)
        
        self.refresh_misc_records()
    
    def refresh_misc_records(self):
        for item in self.misc_tree.get_children():
            self.misc_tree.delete(item)
        
        conn = DatabaseConnection.get_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("SELECT RecordID, StudentID, RecordType, Details, RecordedBy, RecordedOn FROM MiscellaneousRecords")
            records = cursor.fetchall()
            
            for record in records:
                self.misc_tree.insert("", tk.END, values=record)
            
            cursor.close()
            conn.close()
    
    def add_misc_record(self):
        AddMiscRecordWindow(self.root, self.admin_data['AdminID'], self.refresh_misc_records)
    
    def logout(self):
        self.root.destroy()
        login_root = tk.Tk()
        LoginWindow(login_root)
        login_root.mainloop()


class LoginWindow:
    """Login window for both Admin and Student"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("College Student Office - Login")
        self.root.geometry("500x400")
        self.root.resizable(False, False)
        
        # Center window
        self.center_window()
        
        # Main frame
        main_frame = tk.Frame(root, bg="#2c3e50")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = tk.Label(main_frame, text="College Student Office", 
                              font=("Arial", 24, "bold"), bg="#2c3e50", fg="white")
        title_label.pack(pady=30)
        
        # Login form frame
        form_frame = tk.Frame(main_frame, bg="#34495e", padx=40, pady=30)
        form_frame.pack(pady=20)
        
        # User type selection
        tk.Label(form_frame, text="Login as:", font=("Arial", 12), 
                bg="#34495e", fg="white").grid(row=0, column=0, sticky="w", pady=10)
        
        self.user_type = tk.StringVar(value="Student")
        user_type_frame = tk.Frame(form_frame, bg="#34495e")
        user_type_frame.grid(row=0, column=1, sticky="w", pady=10)
        
        tk.Radiobutton(user_type_frame, text="Student", variable=self.user_type, 
                      value="Student", bg="#34495e", fg="white", 
                      selectcolor="#2c3e50", font=("Arial", 10)).pack(side=tk.LEFT, padx=5)
        tk.Radiobutton(user_type_frame, text="Admin", variable=self.user_type, 
                      value="Admin", bg="#34495e", fg="white", 
                      selectcolor="#2c3e50", font=("Arial", 10)).pack(side=tk.LEFT, padx=5)
        
        # Username
        tk.Label(form_frame, text="User ID:", font=("Arial", 12), 
                bg="#34495e", fg="white").grid(row=1, column=0, sticky="w", pady=10)
        self.username_entry = tk.Entry(form_frame, font=("Arial", 12), width=20)
        self.username_entry.grid(row=1, column=1, pady=10, padx=10)
        
        # Password
        tk.Label(form_frame, text="Password:", font=("Arial", 12), 
                bg="#34495e", fg="white").grid(row=2, column=0, sticky="w", pady=10)
        self.password_entry = tk.Entry(form_frame, font=("Arial", 12), 
                                      width=20, show="*")
        self.password_entry.grid(row=2, column=1, pady=10, padx=10)
        
        # Login button
        login_btn = tk.Button(form_frame, text="Login", font=("Arial", 12, "bold"),
                             bg="#27ae60", fg="white", width=15, command=self.login)
        login_btn.grid(row=3, column=0, columnspan=2, pady=20)
        
        # Bind Enter key to login
        self.root.bind('<Return>', lambda e: self.login())
        
        # Info label
        info_label = tk.Label(main_frame, 
                             text="Demo - Admin: ADM001/adminpass | Student: STU001/studpass",
                             font=("Arial", 9), bg="#2c3e50", fg="#95a5a6")
        info_label.pack(pady=10)
    
    def center_window(self):
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f'{width}x{height}+{x}+{y}')
    
    def login(self):
        user_id = self.username_entry.get().strip()
        password = self.password_entry.get().strip()
        user_type = self.user_type.get()
        
        if not user_id or not password:
            messagebox.showerror("Error", "Please enter both User ID and Password")
            return
        
        conn = DatabaseConnection.get_connection()
        if not conn:
            return

        cursor = conn.cursor(dictionary=True)
        try:
            if user_type == "Admin":
                cursor.execute(
                    "SELECT * FROM Admins WHERE AdminID = %s AND Password = %s",
                    (user_id, password),
                )
                user = cursor.fetchone()
                if user:
                    self.root.destroy()
                    admin_root = tk.Tk()
                    AdminDashboard(admin_root, user)
                    admin_root.mainloop()
                else:
                    messagebox.showerror("Login Failed", "Invalid Admin ID or Password")
            else:
                cursor.execute(
                    "SELECT * FROM Students WHERE StudentID = %s AND Password = %s",
                    (user_id, password),
                )
                user = cursor.fetchone()
                if user:
                    self.root.destroy()
                    student_root = tk.Tk()
                    StudentDashboard(student_root, user)
                    student_root.mainloop()
                else:
                    messagebox.showerror("Login Failed", "Invalid Student ID or Password")
        except mysql.connector.Error as err:
            messagebox.showerror("Database Error", f"Error: {err}")
        finally:
            cursor.close()
            conn.close()


# Main Application
def main():
    root = tk.Tk()
    LoginWindow(root)
    root.mainloop()

if __name__ == "__main__":
    main()