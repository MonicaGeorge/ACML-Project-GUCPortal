// Models.
const StaffMemberModel = require('../Models/StaffMemberModel.js');
const HRModel = require('../Models/HRModel.js');
const AcademicStaffModel = require('../Models/AcademicStaffModel.js');
const LocationModel = require('../Models/LocationModel.js');
const FacultyModel = require('../Models/FacultyModel.js');
const DepartmentModel = require('../Models/DepartmentModel.js');
const CourseModel = require('../Models/CourseModel.js');
const CounterModel = require('../Models/CounterModel.js');
const RequestModel = require('../Models/RequestModel.js');

const jwt = require('jsonwebtoken');
const moment = require('moment');

// For routing.
const express = require('express');
const router = express.Router();

function authenticateToken(req, res, next){
    const token = req.header('x-auth-token');
    if(!token) {
        return res.sendStatus(401).status('Access deined please log in first');
    }
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = verified;
    next();
}

// 2 (a)
router.get('/viewDepartmentStaffPerCourse/:courseID', authenticateToken, async (req, res) => {
        const courseID = req.params.courseID;

        const HODAcademicModel = await AcademicStaffModel.findOne({member: req.user.id}); 

        if(HODAcademicModel.isHOD) {
        const course = await CourseModel.findOne({id: courseID});
        if(!course) return res.status(400).send('Course not found!');

        const CourseDepartment = course.department;
        const HODDepartment = HODAcademicModel.department;

        if(HODDepartment.equals(CourseDepartment)) {
        const academicArray = course.academic_staff;
        
        const returnArray = [];
        for(let index = 0; index < academicArray.length; index++) {
          const academicTemp = await AcademicStaffModel.findById(academicArray[index]);
          const staffTemp = await StaffMemberModel.findById(academicTemp.member);
          const officeTemp = await LocationModel.findById(staffTemp.office);
          const departmentTemp = await DepartmentModel.findById(academicTemp.department);
          const facultyTemp = await FacultyModel.findById(academicTemp.faculty);
          
          const returnObject = {
            name: staffTemp.name,
            email: staffTemp.email,
            id: staffTemp.id,
            salary: staffTemp.salary,
            office: officeTemp.id,
            gender: staffTemp.gender,

            department: departmentTemp.name,
            faculty: facultyTemp.name,
            academicType: academicTemp.type
          };

          returnArray.push(returnObject);
      }
        return res.status(200).json(returnArray);
    }
    else {
        return res.status(401).send('Course not under your department!');
    }
}
else {
    return res.status(401).send('Access Denied!');
}
});

// 2 (b)
router.get('/viewDepartmentStaffAllCourses', authenticateToken, async (req, res) => {
    const HODAcademicModel = await AcademicStaffModel.findOne({member: req.user.id}); 

    if(HODAcademicModel.isHOD) {
    const HODDepartment = HODAcademicModel.department;

    const courses = await CourseModel.find({department: HODDepartment});
    const returnArray = [];

    for(let index = 0; index < courses.length; index++) {
        const course = courses[index];

        const returnObject = {
            courseID: course.id,
            courseName: course.name
        };

        const tempArray = [];
        const academicArray = course.academic_staff;

        for(let j = 0; j < academicArray.length; j++) {
            const academicTemp = await AcademicStaffModel.findById(academicArray[j]);
            const staffTemp = await StaffMemberModel.findById(academicTemp.member);
            const officeTemp = await LocationModel.findById(staffTemp.office);
            const departmentTemp = await DepartmentModel.findById(academicTemp.department);
            const facultyTemp = await FacultyModel.findById(academicTemp.faculty);
            
            const tempObject = {
                name: staffTemp.name,
                email: staffTemp.email,
                id: staffTemp.id,
                salary: staffTemp.salary,
                office: officeTemp.id,
                gender: staffTemp.gender,

                department: departmentTemp.name,
                faculty: facultyTemp.name,
                academicType: academicTemp.type
            };

            tempArray.push(tempObject);
        }

        returnObject.academicStaff = tempArray;
        returnArray.push(returnObject);
    }
    return res.status(200).json(returnArray);

  }
    else {
        return res.status(401).send('Access Denied!');
}

});

// 2 (c)
router.get('/viewDepartmentStaff', authenticateToken, async (req, res) => {
    const HODAcademicModel = await AcademicStaffModel.findOne({member: req.user.id}); 

    if(HODAcademicModel.isHOD) {
        const HODDepartment = HODAcademicModel.department;

        const staff = await AcademicStaffModel.find({department: HODDepartment});
        const returnArray = [];

        for(let index = 0; index < staff.length; index++) {
            const academicTemp = await AcademicStaffModel.findById(staff[index]);
            const staffTemp = await StaffMemberModel.findById(academicTemp.member);
            const officeTemp = await LocationModel.findById(staffTemp.office);
            const departmentTemp = await DepartmentModel.findById(academicTemp.department);
            const facultyTemp = await FacultyModel.findById(academicTemp.faculty);
            
            const returnObject = {
              name: staffTemp.name,
              email: staffTemp.email,
              id: staffTemp.id,
              salary: staffTemp.salary,
              office: officeTemp.id,
              gender: staffTemp.gender,
  
              department: departmentTemp.name,
              faculty: facultyTemp.name,
              academicType: academicTemp.type
            };
  
            returnArray.push(returnObject);
        }
        return res.status(200).json(returnArray);
    }
    else {
        return res.status(401).send('Access Denied!');
    }
});


// 3 (a)
router.get('/viewDepartmentStaffMemberDayOff/:memberID', authenticateToken, async (req, res) => {
        const memberID = req.params.memberID;

        const HODAcademicModel = await AcademicStaffModel.findOne({member: req.user.id}); 
        if(HODAcademicModel.isHOD) {
        const HODDepartment = HODAcademicModel.department;

        const staffMemberModel = await StaffMemberModel.findOne({id: memberID});
        var academicMemberModel = null;
        if(staffMemberModel)
            academicMemberModel = await AcademicStaffModel.findOne({member: staffMemberModel._id});

        if(!academicMemberModel) return res.status(400).send('Academic member not found!');
        if(academicMemberModel.department.equals(HODDepartment)) {
            const returnObject = {
            academicStaffMemberName: staffMemberModel.name,
            dayOff: academicMemberModel.day_off
          };
          return res.status(200).json(returnObject);
        }
        else {
            return res.status(401).send("Staff member not in your department!");
        }      
    }
    else {
        return res.status(401).send('Access Denied!');
    } 
});

// 3 (b)
router.get('/viewDepartmentStaffDayOff', authenticateToken, async (req, res) => {
        const HODAcademicModel = await AcademicStaffModel.findOne({member: req.user.id}); 
        const HODDepartment = HODAcademicModel.department;

        if(HODAcademicModel.isHOD) {
        const staffInDepartmentAcademicModel = await AcademicStaffModel.find({department: HODDepartment});

        const returnArray = [];
        for(let index = 0; index < staffInDepartmentAcademicModel.length; index++) {
          const staffTemp = await StaffMemberModel.findById(staffInDepartmentAcademicModel[index].member);
          
          const returnObject = {
            academicStaffMemberID: staffTemp.id,
            academicStaffMemberName: staffTemp.name,
            dayOff: staffInDepartmentAcademicModel[index].day_off
          };

          returnArray.push(returnObject);
      }
        return res.status(200).json(returnArray); 
    }
    else {
        return res.status(401).send('Access Denied!');
    }      
});

// 4
router.get('/viewDayOffLeaveRequests', authenticateToken, async (req, res) => {
    const HODAcademicModel = await AcademicStaffModel.findOne({member: req.user.id});
    
    if(HODAcademicModel.isHOD) {
    const off = await RequestModel.find({sentTo: HODAcademicModel.member, reqType: 'Change Day off'});
    const leave = await RequestModel.find({$and: [
        { // First and condition starts.
      $or: [
        {reqType: 'Maternity Leave'},
        {reqType: 'Sick Leave'},
        {reqType: 'Compensation Leave'},
        {reqType: 'Accidental Leave'},
        {reqType: 'Annual Leave'}
      ],  
        }, // First and condition ends.

        {sentTo: HODAcademicModel.member} // Second and condition.
      ], 
    });

    const updatedOff = [];
    for(let index = 0; index < off.length; index++) {
        const request = off[index];
        const offObject = {
            requestID: request.requestID,
            requestType: request.reqType,
            state: request.state,
            submission_date: moment(request.submission_date).format('YYYY-MM-DD')
        };

        const sentByStaff = await StaffMemberModel.findById(request.sentBy);

        offObject.sentByID = sentByStaff.id;
        offObject.sentByName = sentByStaff.name;
        if(request.HODRejectionReason) offObject.HODRejectionReason = request.HODRejectionReason;

        offObject.newDayOff = request.newDayOff;

        if(request.reason) offObject.reason = request.reason;

        updatedOff.push(offObject);
    }

    const updatedLeave = [];
    for(let index = 0; index < leave.length; index++) {
        const request = leave[index];

        const leaveObject = {
            requestID: request.requestID,
            requestType: request.reqType,
            state: request.state,
            submission_date: moment(request.submission_date).format('YYYY-MM-DD')
        };

        const sentByStaff = await StaffMemberModel.findById(request.sentBy);

        leaveObject.sentByID = sentByStaff.id;
        leaveObject.sentByName = sentByStaff.name;
        if(request.HODRejectionReason) leaveObject.HODRejectionReason = request.HODRejectionReason;

        if(request.reqType == 'Maternity Leave') {
            leaveObject.maternityDoc = request.maternityDoc;
            if(request.reason) leaveObject.reason = request.reason;
        }
        else if(request.reqType == 'Sick Leave') {
            leaveObject.medicalDoc = request.medicalDoc;
            leaveObject.sickDay = moment(request.sickDay).format('YYYY-MM-DD')
            if(request.reason) leaveObject.reason = request.reason;
        }
        else if(request.reqType == 'Accidental Leave') {
            leaveObject.accidentDate = moment(request.accidentDate).format('YYYY-MM-DD');
            if(request.reason) leaveObject.reason = request.reason;
        }
        else if(request.reqType == 'Compensation Leave'){
            leaveObject.missedDate = moment(request.missedDate).format('YYYY-MM-DD');
            leaveObject.reason = request.reason;
        }
        else {
            leaveObject.slotDate = moment(request.slotDate).format('YYYY-MM-DD');
            leaveObject.slotNum = request.slotNum;
            leaveObject.slotLoc = request.slotLoc;

            const replacementStaff = await StaffMemberModel.findById(request.replacementStaff);

            leaveObject.replacementStaffID = replacementStaff.id;
            leaveObject.replacementStaffName = replacementStaff.name;
            if(!request.reason) leaveObject.reason = request.reason;
        }
        updatedLeave.push(leaveObject);
    }

    const returnObject = {
        dayOffRequests: updatedOff,
        leaveRequests: updatedLeave,
    };

    return res.status(200).json(returnObject);
}

else {
    return res.status(401).send('Access Denied!');
} 
});

// 7 (a)
router.get('/courseCoverage/:courseID', authenticateToken, async (req, res) => {
    const courseID = req.params.courseID;

    const HODAcademicModel = await AcademicStaffModel.findOne({member: req.user.id}); 

    if(HODAcademicModel.isHOD) {
    const course = await CourseModel.findOne({id: courseID});
    if(!course) return res.status(400).send('Course does not exist!');
    if(!HODAcademicModel.department.equals(course.department)) return res.status(401).send('Course not under your department!');
    if(course.slots_needed == 0) return res.status(400).send('Course does not have any slots for now!');

    const coverage = course.slots_covered/course.slots_needed * 100;
    return res.status(200).send('Course coverage is equal to: ' + coverage + "%");
    }

    else {
        return res.status(401).send('Access Denied!');
    }
});

// 7 (b)
router.get('/coursesCoverage', authenticateToken, async (req, res) => {
    const HODAcademicModel = await AcademicStaffModel.findOne({member: req.user.id}); 

    if(HODAcademicModel.isHOD) {
    const courses = await CourseModel.find({department: HODAcademicModel.department});

    const errorMessages = [];
    for(let index = 0; index < courses.length; index++) {
        const errorMessage = {courseID: courses[index].id};
        if(courses[index].slots_needed == 0) errorMessage.courseDoesNotHaveSlotsAssigned = true;
        else {
            const coverage = courses[index].slots_covered/courses[index].slots_needed * 100;
            errorMessage.courseCoverage = coverage;
        }
        errorMessages.push(errorMessage);
    }

    return res.status(200).json(errorMessages);
}

    else {
        return res.status(401).send('Access Denied!');
    }
});

// 8
router.get('/teachingAssignmentAllCourses', authenticateToken, async (req, res) => {
    const HODAcademicModel = await AcademicStaffModel.findOne({member: req.user.id}); 

    if(HODAcademicModel.isHOD) {
    const HODDepartment = HODAcademicModel.department;
    const courses = await CourseModel.find({department: HODDepartment});

    // Has objectID of academic staff and his respective slots.
    const returnArray = [];
    Array.prototype.forEach.call(courses, (course) => {
        const academic_staff = course.academic_staff;
        const oneCourseTeachingAssignment = [];

        academic_staff.forEach((oneStaff) => {
            const slotsTaughtbyStaff = course.schedule.filter((slot) => {
                if(slot.academic_member_id) return oneStaff.equals(slot.academic_member_id)
            });

            for(let j = 0; j < slotsTaughtbyStaff.length; j++) {
                const oldSlot = slotsTaughtbyStaff[j];
                const newSlot = {
                    date: moment(oldSlot.date).format('YYYY-MM-DD'),
                    day: oldSlot.day,
                    number: oldSlot.number,
                    location: oldSlot.location,
                    isReplaced: oldSlot.isReplaced
                };

                slotsTaughtbyStaff[j] = newSlot;
            }
            const teachingAssignment = {
                staffID: oneStaff,
                staffName: oneStaff,
                slotsTaughtbyStaff: slotsTaughtbyStaff
            }
            oneCourseTeachingAssignment.push(teachingAssignment);
        });

        const oneCourse = {
            courseID: course.id,
            courseName: course.name,
            oneCourseTeachingAssignment: oneCourseTeachingAssignment
        }

        returnArray.push(oneCourse);
    }
    );

    // Change ObjectIDs with real ids.
    for(let index = 0; index < returnArray.length; index++) {
        for(let i = 0; i < returnArray[index].oneCourseTeachingAssignment.length; i++) {
            const staffID = returnArray[index].oneCourseTeachingAssignment[i].staffID;
            const academicStaff = await AcademicStaffModel.findById(staffID);
            const staff = await StaffMemberModel.findById(academicStaff.member);
            returnArray[index].oneCourseTeachingAssignment[i].staffID = staff.id;
            returnArray[index].oneCourseTeachingAssignment[i].staffName = staff.name;

            for(let j = 0; j < returnArray[index].oneCourseTeachingAssignment[i].slotsTaughtbyStaff.length; j++) {
                const oldSlot = returnArray[index].oneCourseTeachingAssignment[i].slotsTaughtbyStaff[j];
                const location = await LocationModel.findById(oldSlot.location);
                oldSlot.location = location.id;
                returnArray[index].oneCourseTeachingAssignment[i].slotsTaughtbyStaff[j] = oldSlot;
            }
        }
    }

    return res.status(200).json(returnArray);
    }
    else {
        return res.status(401).send('Access Denied!');
    }
});

// // Route 1.
// router.route('/CourseInstructorforSingleCourse')
// .post(async (req, res) => {
//     if(req.user.isHOD) {
//         const {courseID, courseInstructorID} = req.body;
//         const course = await CourseModel.findOne({id: courseID});
//         if(!course) {
//             return res.status(400).send('Course does not exist!');
//         }
//         else {
//             const courseInstructorStaffModel = await StaffMemberModel.findOne({id: courseInstructorID});
//             const courseInstructorAcademicModel = await AcademicStaffModel.findOne({member: courseInstructorStaffModel._id});

//             if(courseInstructorAcademicModel.type == 'Course Instructor') {
//             const HODStaffModel = await StaffMemberModel.findOne({id: req.user.id});
//             const HODAcademicModel = await AcademicStaffModel.findOne({member: HODStaffModel._id});
//             const HODDepartment = HODAcademicModel.department;
//             const CourseDepartment = course.department;

//             if(HODDepartment.equals(CourseDepartment)) {
//                 await CourseModel.findOneAndUpdate({id: courseID}, {$addToSet: {academic_staff: courseInstructorAcademicModel._id}}, {new: true}, (error, doc) => {
//                     if(error) console.log("Something wrong happened while updating the course with course instructor");
//                     console.log(doc);
//                 });
//             }
//             else {
//                 return res.status(401).send('Course not under your department!');
//             }
//         }
//         else {
//                 return res.status(400).send('Staff member is not a course instructor!');
//             }
//         }
//     }
//     else {
//         res.status(401).send('Access Denied!');
//     }
// })

// .delete(async (req, res) => {
//  //  if(req.user.isHOD) {
//        const {courseID, courseInstructorID} = req.body;
//        const course = await CourseModel.findOne({id: courseID});
//        if(!course) {
//            return res.status(400).send('Course does not exist!');
//        }
//        else {
//            const courseInstructorStaffModel = await StaffMemberModel.findOne({id: courseInstructorID});
//            const courseInstructorAcademicModel = await AcademicStaffModel.findOne({member: courseInstructorStaffModel._id});

//            if(courseInstructorAcademicModel.type == 'Course Instructor') {
//           // const HODStaffModel = await StaffMemberModel.findOne({id: req.user.id});
//           // const HODAcademicModel = await AcademicStaffModel.findOne({member: HODStaffModel._id});
//            const HODAcademicModel = await AcademicStaffModel.findOne({member: courseInstructorStaffModel._id});
//            const HODDepartment = HODAcademicModel.department;
//            const CourseDepartment = course.department;

//            if(HODDepartment.equals(CourseDepartment)) {
//                await CourseModel.findOneAndUpdate({id: courseID}, {$pull: {academic_staff: courseInstructorStaffModel._id}}, {new: true}, (error, doc) => {
//                    if(error) console.log("Something wrong happened while updating the course with course instructor");
//                    console.log(doc);
//                });
//            }
//            else {
//                return res.status(401).send('Course not under your department!');
//            }
//        }
//        else {
//                return res.status(400).send('Staff member is not a course instructor!');
//            }
//        }
//  //  }
//  /*  else {
//        res.status(401).send('Access Denied!');
//    }*/
// });

// // Route 2.
// router.route('/viewDepartmentStaff')
// .get(async (req, res) => {
//     //  if(req.user.isHod) {
//         const HODStaffModel = await StaffMemberModel.findOne({id: "ac-1"}); // Delete later.
//         const HODAcademicModel = await AcademicStaffModel.findOne({member: HODStaffModel._id}); // member: req.user.id or member: req.user._id.
//         const HODDepartment = HODAcademicModel.department;
//         const staffInDepartmentAcademicModel = await AcademicStaffModel.find({department: HODDepartment});

//         const returnArray = [];
//         for(let index = 0; index < staffInDepartmentAcademicModel.length; index++) {
//           const staffTemp = await StaffMemberModel.findById(staffInDepartmentAcademicModel[index].member);
//           const officeTemp = await LocationModel.findById(staffTemp.office);
//           const departmentTemp = await DepartmentModel.findById(staffInDepartmentAcademicModel[index].department);
//           const facultyTemp = await FacultyModel.findById(staffInDepartmentAcademicModel[index].faculty);
          
//           const returnObject = {};
//           returnObject.name = staffTemp.name;
//           returnObject.email = staffTemp.email;
//           returnObject.id = staffTemp.id;
//           returnObject.salary = staffTemp.salary;
//           returnObject.office = officeTemp.id;
//           returnObject.department = departmentTemp.name;
//           returnObject.faculty = facultyTemp.id;
//           if(staffTemp.hasOwnProperty('gender')) returnObject.gender = staffTemp.gender;
//           returnArray.push(returnObject);
//       }
//         return res.send(returnArray);         
//  // }
//   /*else {
//       res.status(401).send('Access Denied!');
//   }*/
// });


// Export the router.
module.exports = router;