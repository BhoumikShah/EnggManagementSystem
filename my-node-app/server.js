const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve your HTML files from 'public' folder

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',           // Your MySQL username
    password: 'bhoumik',  // Your MySQL password
    database: 'EnggStudentMgmt'
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL Database');
});

// ===== API ENDPOINTS =====

// Get all students
app.get('/api/students', (req, res) => {
    const query = `
        SELECT s.*, d.DepartmentName 
        FROM Students s 
        INNER JOIN Departments d ON s.DepartmentID = d.DepartmentID
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get student by ID
app.get('/api/students/:id', (req, res) => {
    const query = 'SELECT * FROM Students WHERE StudentID = ?';
    db.query(query, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
});

// Add new student
app.post('/api/students', (req, res) => {
    const query = `
        INSERT INTO Students (FirstName, LastName, Email, Phone, DOB, Gender, 
                            EnrollmentDate, DepartmentID, Semester, CGPA, Status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        req.body.firstName, req.body.lastName, req.body.email, 
        req.body.phone, req.body.dob, req.body.gender,
        req.body.enrollmentDate, req.body.departmentID, 
        req.body.semester, req.body.cgpa, req.body.status
    ];
    
    db.query(query, values, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Student added successfully', id: results.insertId });
    });
});

// Update student
app.put('/api/students/:id', (req, res) => {
    const query = `
        UPDATE Students 
        SET FirstName=?, LastName=?, Email=?, Phone=?, DOB=?, Gender=?, 
            DepartmentID=?, Semester=?, CGPA=?, Status=?
        WHERE StudentID = ?
    `;
    const values = [
        req.body.firstName, req.body.lastName, req.body.email,
        req.body.phone, req.body.dob, req.body.gender,
        req.body.departmentID, req.body.semester, req.body.cgpa,
        req.body.status, req.params.id
    ];
    
    db.query(query, values, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Student updated successfully' });
    });
});

// Delete student
app.delete('/api/students/:id', (req, res) => {
    const query = 'DELETE FROM Students WHERE StudentID = ?';
    db.query(query, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Student deleted successfully' });
    });
});

// Get all departments
app.get('/api/departments', (req, res) => {
    db.query('SELECT * FROM Departments', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get all courses
app.get('/api/courses', (req, res) => {
    const query = `
        SELECT c.*, d.DepartmentName 
        FROM Courses c 
        INNER JOIN Departments d ON c.DepartmentID = d.DepartmentID
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get all enrollments
app.get('/api/enrollments', (req, res) => {
    const query = `
        SELECT e.*, 
               CONCAT(s.FirstName, ' ', s.LastName) as StudentName,
               c.CourseName
        FROM Enrollments e
        INNER JOIN Students s ON e.StudentID = s.StudentID
        INNER JOIN Courses c ON e.CourseID = c.CourseID
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get all faculty
app.get('/api/faculty', (req, res) => {
    const query = `
        SELECT f.*, d.DepartmentName 
        FROM Faculty f 
        INNER JOIN Departments d ON f.DepartmentID = d.DepartmentID
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get all examinations
app.get('/api/examinations', (req, res) => {
    const query = `
        SELECT ex.*, c.CourseName 
        FROM Examinations ex 
        INNER JOIN Courses c ON ex.CourseID = c.CourseID
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Dashboard statistics
app.get('/api/dashboard/stats', (req, res) => {
    const queries = {
        totalStudents: 'SELECT COUNT(*) as count FROM Students WHERE Status = "Active"',
        totalDepartments: 'SELECT COUNT(*) as count FROM Departments',
        totalCourses: 'SELECT COUNT(*) as count FROM Courses',
        totalFaculty: 'SELECT COUNT(*) as count FROM Faculty',
        avgCGPA: 'SELECT AVG(CGPA) as avg FROM Students WHERE Status = "Active"'
    };
    
    const stats = {};
    let completed = 0;
    
    Object.keys(queries).forEach(key => {
        db.query(queries[key], (err, results) => {
            if (!err) {
                stats[key] = results[0].count || results[0].avg;
            }
            completed++;
            if (completed === Object.keys(queries).length) {
                res.json(stats);
            }
        });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
// Fetch students from backend
async function loadStudents() {
    try {
        const response = await fetch('http://localhost:3000/api/students');
        const students = await response.json();
        
        const tbody = document.querySelector('#studentsTable tbody');
        tbody.innerHTML = '';
        
        students.forEach(student => {
            const row = `
                <tr>
                    <td>${student.StudentID}</td>
                    <td>${student.FirstName} ${student.LastName}</td>
                    <td>${student.Email}</td>
                    <td>${student.DepartmentName}</td>
                    <td>${student.Semester}</td>
                    <td>${student.CGPA}</td>
                    <td><span class="badge badge-success">${student.Status}</span></td>
                    <td class="action-buttons">
                        <button class="btn-primary" onclick="viewStudent(${student.StudentID})">View</button>
                        <button class="btn-secondary" onclick="editStudent(${student.StudentID})">Edit</button>
                        <button class="btn-danger" onclick="deleteStudent(${student.StudentID})">Delete</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading students:', error);
        showAlert('Failed to load students', 'error');
    }
}

// Add new student
async function addStudent(studentData) {
    try {
        const response = await fetch('http://localhost:3000/api/students', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
        });
        
        const result = await response.json();
        showAlert('Student added successfully!', 'success');
        loadStudents();
    } catch (error) {
        console.error('Error adding student:', error);
        showAlert('Failed to add student', 'error');
    }
}

// Delete student
async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    try {
        const response = await fetch(`http://localhost:3000/api/students/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        showAlert('Student deleted successfully!', 'success');
        loadStudents();
    } catch (error) {
        console.error('Error deleting student:', error);
        showAlert('Failed to delete student', 'error');
    }
}