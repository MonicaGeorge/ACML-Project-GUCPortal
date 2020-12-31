const cors = require('cors');
// Routes Imports.
const HODRoutes = require('./Routes/HODRoutes.js');
const StaffRoutes = require('./Routes/StaffMemberRoutes.js');
const AcademicRoutes = require('./Routes/AcademicMemberRoutes.js');
const HRRoutes = require('./Routes/HRroutes.js');
const InstructorRoutes = require('./Routes/instructorRoutes.js');

const express = require('express');
const app = express();
app.use(express.json());

app.use(cors())
// app.use().
app.use('/HOD', HODRoutes);
app.use('/Instructor', InstructorRoutes);
app.use('/CourseCoordinator', InstructorRoutes);
app.use('/academic', AcademicRoutes);
app.use('/staff', StaffRoutes);
app.use('/HR', HRRoutes);

// Exporting the app.
module.exports.app = app;