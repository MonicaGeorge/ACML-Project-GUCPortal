const express = require("express");
const router = express.Router();
const AcademicStaff = require("../Models/AcademicStaffModel.js");
const StaffMember = require("../Models/StaffMemberModel.js");
const location = require("../Models/LocationModel.js");
const department = require("../Models/DepartmentModel");
const course = require("../Models/CourseModel");
const jwt = require("jsonwebtoken");
const moment = require('moment');

function authenticateToken(req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).send("Access denied please log in first");
  }
  const verified = jwt.verify(token, process.env.TOKEN_SECRET);
  req.user = verified;
  next();
}

//------------------------------------------------------------1--------------------------------------------------
// 1 (a) Course coverage
router.get("/coursecoverage", authenticateToken, async (req, res) => {
  try {
    const instr = await StaffMember.findOne({ _id: req.user.id });
    if (!instr) res.status(400).send("Something went wrong");
    else {
      const inst = await AcademicStaff.findOne({ member: instr._id });
      if (!inst) res.status(400).send("Something went wrong");
      else {
        if (inst.type == "Course Instructor") {
          const courses = inst.courses;
          var coverage = [];
          for (var i = 0; i < courses.length; i++) {
            var c = await course.findById(courses[i]);
            if (c.slots_needed != 0)
              coverage.push({
                "course id": c.id,
                coverage: (100 * c.slots_covered) / c.slots_needed + "%"
              });
            else
              coverage.push({
                "course id": c.id,
                courseDoesNotHaveSlotsAssigned: true
              });
          }
          res.status(200).json(coverage);
        } else res.status(401).send("Access denied");
      }
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 1 (b)
router.get("/coursecoverage/:courseID", authenticateToken, async (req, res) => {
  try {
    const courseID = req.params.courseID;
    const instr = await StaffMember.findOne({ _id: req.user.id });
    if (!instr) res.status(400).send("Something went wrong");
    else {
      const inst = await AcademicStaff.findOne({ member: instr._id });
      if (!inst) res.status(400).send("Something went wrong");
      else {
        if (inst.type == "Course Instructor") {
          const thecourse = await course.findOne({ id: courseID });
          if (!thecourse) return res.status(400).send("Course does not exist");
          if(!thecourse.department.equals(inst.department)) return res.status(403).send("You are not assigned to this department");
          
          const coverage = {};
          if (thecourse.slots_needed != 0)
            coverage = {
              "course id": c.id,
              coverage: (100 * c.slots_covered) / c.slots_needed + "%",
            };
          else
            coverage = {
              "course id": c.id,
              courseDoesNotHaveSlotsAssigned: true,
            };

          res.status(200).json(coverage);
        } else res.status(401).send("Access denied");
      }
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});
//------------------------------------------------------------2--------------------------------------------------
// 2 (a) Slots assignment for all courses assigned to the course instructor
router.get(
  "/slotsAssignment",
  authenticateToken,
  async (req, res) => {
    try {
      const instr = await StaffMember.findOne({ "_id": req.user.id });
      if (!instr) res.status(400).json({ msg: "Something went wrong" });

      else {
        const inst = await AcademicStaff.findOne({ member: req.user.id });
        if (!inst) res.status(400).json({ msg: "Something went wrong" });

        else {
          if (inst.type == "Course Instructor") {
            const coursesInst = inst.courses;
            const courses = [];
            for (var i = 0; i < coursesInst.length; i++) {
              const oneCourse = await course.findOne({ "_id": coursesInst[i] });
              courses.push(oneCourse);
            }
            // Has objectID of academic staff and his respective slots.
            const returnArray = [];
            Array.prototype.forEach.call(courses, (course) => {
              const academic_staff = course.academic_staff;
              const oneCourseTeachingAssignment = [];

              academic_staff.forEach((oneStaff) => {
                const slotsTaughtbyStaff = course.schedule.filter((slot) => {
                  if (slot.academic_member_id) return oneStaff.equals(slot.academic_member_id)
                });

                for (let j = 0; j < slotsTaughtbyStaff.length; j++) {
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
            for (let index = 0; index < returnArray.length; index++) {
              for (let i = 0; i < returnArray[index].oneCourseTeachingAssignment.length; i++) {
                const staffID = returnArray[index].oneCourseTeachingAssignment[i].staffID;
                const academicStaff = await AcademicStaff.findOne({ "_id": staffID });
                const staff = await StaffMember.findOne({ "_id": academicStaff.member });
                returnArray[index].oneCourseTeachingAssignment[i].staffID = staff.id;
                returnArray[index].oneCourseTeachingAssignment[i].staffName = staff.name;

                for (let j = 0; j < returnArray[index].oneCourseTeachingAssignment[i].slotsTaughtbyStaff.length; j++) {
                  const oldSlot = returnArray[index].oneCourseTeachingAssignment[i].slotsTaughtbyStaff[j];
                  const slotlocation = await location.findOne({ "_id": oldSlot.location });
                  oldSlot.location = slotlocation.id;
                  returnArray[index].oneCourseTeachingAssignment[i].slotsTaughtbyStaff[j] = oldSlot;
                }
              }
            }

            return res.status(200).json({ msg: returnArray });
          } else res.status(401).json({ msg: "Access denied" });
        }
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// 2 (b) slots assignment for a particular course assigned to the course instructor.
router.get("/slotsAssignment/:courseID", authenticateToken, async (req, res) => {
  try {
    const instr = await StaffMember.findOne({ "_id": req.user.id });
    if (!instr) res.status(400).json({ msg: "Something went wrong" });

    else {
      const inst = await AcademicStaff.findOne({ member: instr._id });
      if (!inst) res.status(400).json({ msg: "Something went wrong" });

      else {
        if (inst.type == "Course Instructor") {
          const courseID = req.params.courseID;
          const c = await course.findOne({ id: courseID });
          if (!c) return res.status(400).json({ msg: 'Course does not exist!' });
          const courseAssigned = inst.courses.some(singleCourse => { return singleCourse.equals(c._id) });
          if (!courseAssigned) return res.status(403).json({ msg: 'You are not assigned to this course!' });

          // Has objectID of academic staff and his respective slots.
          const academic_staff = c.academic_staff;
          const oneCourseTeachingAssignment = [];

          academic_staff.forEach((oneStaff) => {
            const slotsTaughtbyStaff = c.schedule.filter((slot) => {
              if (slot.academic_member_id) return oneStaff.equals(slot.academic_member_id)
            });

            for (let j = 0; j < slotsTaughtbyStaff.length; j++) {
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
            courseID: c.id,
            courseName: c.name,
            oneCourseTeachingAssignment: oneCourseTeachingAssignment
          }

          // Change ObjectIDs with real ids.
          for (let i = 0; i < oneCourse.oneCourseTeachingAssignment.length; i++) {
            const staffID = oneCourse.oneCourseTeachingAssignment[i].staffID;
            const academicStaff = await AcademicStaff.findOne({ "_id": staffID });
            const staff = await StaffMember.findOne({ "_id": academicStaff.member });
            oneCourse.oneCourseTeachingAssignment[i].staffID = staff.id;
            oneCourse.oneCourseTeachingAssignment[i].staffName = staff.name;

            for (let j = 0; j < oneCourse.oneCourseTeachingAssignment[i].slotsTaughtbyStaff.length; j++) {
              const oldSlot = oneCourse.oneCourseTeachingAssignment[i].slotsTaughtbyStaff[j];
              const oneLocation = await location.findById(oldSlot.location);
              oldSlot.location = oneLocation.id;
              oneCourse.oneCourseTeachingAssignment[i].slotsTaughtbyStaff[j] = oldSlot;
            }
          }

          return res.status(200).json({ msg: oneCourse });
        } else res.status(401).json({ msg: "Access denied" });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//------------------------------------------------------------3--------------------------------------------------
// 3 (a) Staff per department

router.get("/staffperdepartment", authenticateToken, async (req, res) => {
  try {
    const instr = await StaffMember.findOne({ _id: req.user.id });
    if (!instr) res.status(400).json({ msg: "Something went wrong" });
    else {
      const inst = await AcademicStaff.findOne({ member: instr._id });
      if (!inst) res.status(400).json({ msg: "Something went wrong" });
      else {
        if (inst.type == "Course Instructor") {
          const departmentid = inst.department;
          const dep = await department.findOne({ _id: departmentid });
          if (!dep)
            res.status(400).json({ msg: "The department name is incorrect" });
          else {
            const staff = await AcademicStaff.find({ department: dep._id });
            var s = [];
            for (var i = 0; i < staff.length; i++) {
              var n = await StaffMember.findOne({ _id: staff[i].member });
              var off = await location.findOne({ _id: n.office });
              if (!off) off = off.id;
              s.push({
                name: n.name,
                id: n.id,
                gender: n.gender,
                email: n.email,
                salary: n.salary,
                office: off,
                dayoff: staff[i].day_off,
                type: staff[i].type,
              });
            }
            res.status(200).json({ msg: s });
          }
        } else res.status(401).json({ msg: "Access denied" });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3 (b) Staff Per Course
router.get("/staffpercourse", authenticateToken, async (req, res) => {
  try {
    const instr = await StaffMember.findOne({ _id: req.user.id });
    if (!instr) res.status(400).json({ msg: "something went wrong" });

    else {
      const inst = await AcademicStaff.findOne({ member: instr._id });
      if (!inst) res.status(400).json({ msg: "Something went wrong" });

      else {
        if (inst.type == "Course Instructor") {
          const courseid = req.body.Scourse;

          if (!courseid) {
            const courses = inst.courses;
            const staff = Array(courses.length);

            for (var i = 0; i < courses.length; i++) {
              var c = await course.findOne({ _id: courses[i] });
              var staffmembers = Array(c.academic_staff.length);

              for (var j = 0; j < c.academic_staff.length; j++) {
                if (!c.academic_staff[j].equals(inst._id)) {
                  var academicmem = await AcademicStaff.findOne({
                    _id: c.academic_staff[j]
                  });
                  var staffmem = await StaffMember.findOne({
                    _id: academicmem.member
                  })

                  var office = await location.findOne({ _id: staffmem.office });

                  staffmembers[j] = {
                    name: staffmem.name,
                    id: staffmem.id,
                    gender: staffmem.gender,
                    email: staffmem.email,
                    salary: staffmem.salary,
                    office: office.id,
                    day_off: academicmem.day_off,
                    type: academicmem.type
                  };
                }
              }

              staff[i] = {
                "course name": c.name,
                "course id": c.id,
                "staff members": staffmembers,
              };
            }
            res.status(200).json({ msg: staff });
          }

          else {
            const courses = inst.courses;
            const thecourse = await course.findOne({ id: courseid });
            if (!thecourse)
              res
                .status(400)
                .json({ msg: "The course id you entered is incorrect" });
            else {
              var assigned = false;
              for (var i = 0; i < courses.length; i++) {
                if (courses[i].equals(thecourse._id)) {
                  assigned = true;
                  break;
                }
              }
              if (assigned) {
                var staffmembers = Array(thecourse.academic_staff.length);
                for (var j = 0; j < thecourse.academic_staff.length; j++) {
                  if (!thecourse.academic_staff[j].equals(inst._id)) {
                    var staffmem = await AcademicStaff.findOne({
                      _id: thecourse.academic_staff[j],
                    });
                    var s = await StaffMember.findOne({ _id: staffmem.member });
                    staffmembers[j] = {
                      name: s.name,
                      id: s.id,
                      email: s.email,
                      office: s.office,
                      dayoff: staffmem.day_off,
                    };
                  }
                }
                res.status(200).json({ msg: staffmembers });
              }
              else
                res
                  .status(400)
                  .json({ msg: "You are not assigned to this course" });
            }
          }
        } else res.status(401).json({ msg: "Access denied" });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//------------------------------------------------------------4--------------------------------------------------
// 4- Assigned to an unassigned slot.
router.route("/Assignment").post(authenticateToken, async (req, res) => {
  try {
    const instr = await StaffMember.findOne({ "_id": req.user.id });
    if (!instr) res.status(400).json({ msg: "Something went wrong." });

    else {
      const inst = await AcademicStaff.findOne({ member: instr._id });
      if (!inst) res.status(400).json({ msg: "Something went wrong." });

      else {
        if (inst.type == "Course Instructor") {
          const { courseid, day, number, slocation, memid } = req.body;
          if (!courseid || !day || !number || !slocation || !memid)
            res
              .status(400)
              .json({ msg: "Please fill all the required fields." });

          else {
            const loc = await location.findOne({ id: slocation });
            if (!loc)
              res
                .status(400)
                .json({ msg: "The location you entered does not exist." });

            else {
              const thecourse = await course.findOne({ id: courseid });
              if (!thecourse)
                res.status(400).json({ msg: "This course id does not exist." });

              else {
                var assigned = false;
                for (var i = 0; i < inst.courses.length; i++) {
                  if (inst.courses[i].equals(thecourse._id)) {
                    assigned = true;
                    break;
                  }
                }
                if (!assigned)
                  res
                    .status(400)
                    .json({ msg: "You are not assigned to this course." });
                else {
                  const smem = await StaffMember.findOne({ id: memid });
                  if (!smem)
                    res.status(400).json({
                      msg: "There is no staff member with that id."
                    });
                  else {
                    const mem = await AcademicStaff.findOne({
                      member: smem._id,
                    });
                    if (
                      !mem ||
                      !mem.department.equals(inst.department)
                    )
                      res.status(400).json({
                        msg: "There is no TA in your department with that id."
                      });
                    else {
                      const busySlots = [];
                      thecourse.schedule.forEach(slot => {
                        if (slot.day == day && slot.number == number && slot.location.equals(loc._id)) {

                          const busySlot = { date: moment(slot.date).format('YYYY-MM-DD') };
                          var free = true;
                          for (var i = 0; i < mem.schedule.length; i++) {
                            if (
                              mem.schedule[i].date.getTime() == slot.date.getTime() &&
                              mem.schedule[i].number == slot.number) {
                              free = false;
                              break;
                            }
                          }

                          if (free) {
                            var duplicate = false;
                            for (var k = 0; k < mem.courses.length; k++) {
                              if (mem.courses[k].equals(thecourse._id)) {
                                duplicate = true;
                                break;
                              }
                            }

                            if (!slot.academic_member_id) {
                              slot.academic_member_id = mem._id;
                              thecourse.slots_covered++;
                              const newSlot = {
                                date: slot.date,
                                day: slot.day,
                                course: thecourse._id,
                                number: slot.number,
                                location: slot.location
                              };
                              mem.schedule.push(newSlot);
                              if (!duplicate) {
                                thecourse.academic_staff.push(mem._id);
                                mem.courses.push(thecourse._id);
                              }
                            }
                            else {
                              busySlot.busySlot = true;
                              busySlots.push(busySlot);
                            }
                          }
                          else {
                            busySlot.unfreeSlot = true;
                            busySlots.push(busySlot);
                          }
                        }
                      });

                      await thecourse.save();
                      await mem.save();
                      const correctSlots = thecourse.schedule.filter(slot => { return slot.day == day && slot.number == number && slot.location.equals(loc._id) });
                      if (correctSlots.length == 0) res.status(400).json({ msg: "No slots with those details." });
                      else if (busySlots.length != 0) res.status(400).json({ msg: busySlots });
                      else res.status(200).send({ msg: "Operation successful!" });
                    }
                  }
                }
              }
            }
          }
        } else res.status(401).json({ msg: "Access denied" });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//------------------------------------------------------------5--------------------------------------------------
// 5 (a) Delete an academic member assignment in courses he is assigned.
router.delete('/deleteAcademicAssignment', authenticateToken, async (req, res) => {
  const { courseID, academicMemberID, number, locationID, day } = req.body;
  if (!courseID || !academicMemberID || !number || !locationID || !day) return res.status(400).json({ msg: 'Please fill all required fields!' });

  const instr = await StaffMember.findOne({ _id: req.user.id });
  if (!instr) return res.status(400).json({ msg: "Something went wrong" });

  const inst = await AcademicStaff.findOne({ member: req.user.id });
  if (!inst) return res.status(400).json({ msg: "Something went wrong" });

  const thecourse = await course.findOne({ id: courseID });
  if (!thecourse) return res.status(400).json({ msg: 'The course does not exist' });

  const thelocation = await location.findOne({ id: locationID });
  if (!thelocation) return res.status(400).json({ msg: 'The location does not exist' });

  const removedStaffMember = await StaffMember.findOne({ id: academicMemberID });
  if (!removedStaffMember) return res.status(400).json({ msg: 'There is no staff member with this id' });

  const removedAcademicMember = await AcademicStaff.findOne({ member: removedStaffMember._id });
  if (!removedAcademicMember) return res.status(400).json({ msg: 'The staff member is not an academic member' });

  if (inst.type == 'Course Instructor') {
    var assigned = false;
    const coursesAssigned = inst.courses;
    for (var i = 0; i < coursesAssigned.length; i++) {
      if (coursesAssigned[i].equals(thecourse._id)) {
        assigned = true;
        break;
      }
    }
    if (!assigned) return res.status(403).json({ msg: 'You are not assigned to this course' });

    var removedAssigned = false;
    for (var i = 0; i < thecourse.academic_staff.length; i++) {
      if (thecourse.academic_staff[i].equals(removedAcademicMember._id)) {
        removedAssigned = true;
        break;
      }
    }
    if (!removedAssigned) return res.status(400).json({ msg: 'The academic member you want to delete his assignment from one of the slots is not assigned to this course.' });

    const withoutRemoved = thecourse.schedule.filter((slot) => {
      if (slot.academic_member_id && removedAcademicMember._id.equals(slot.academic_member_id)) return !(slot.day == day && slot.number == number && slot.location.equals(thelocation._id));
      else return true;
    });

    console.log(withoutRemoved);
    const slotsRemovedNum = thecourse.slots_covered - withoutRemoved.length;
    thecourse.slots_covered -= slotsRemovedNum;
    thecourse.schedule = withoutRemoved;
    await thecourse.save();

    if (slotsRemovedNum == 0) return res.status(400).json({ msg: 'There are not slots with such details that the academic member is assigned to.' });

    const withoutRemovedCourses = removedAcademicMember.schedule.filter((slot) => {
      if (slot.course && thecourse._id.equals(slot.course)) return !(slot.day == day && slot.number == number && slot.location.equals(thelocation._id));
      else return true;
    });
    console.log(withoutRemovedCourses);

    removedAcademicMember.schedule = withoutRemovedCourses;
    await removedAcademicMember.save();

    return res.status(200).json({ msg: 'Operation successful' });
  }
  else return res.status(403).send('Access Denied');

});

// 6- Remove an academic member in courses he is assigned.
router.delete('/removeAssignedAcademic', authenticateToken, async (req, res) => {
  const { courseID, academicMemberID } = req.body;
  if (!courseID || !academicMemberID) return res.status(400).json({ msg: 'Please fill all required fields!' });

  const instr = await StaffMember.findOne({ _id: req.user.id });
  if (!instr) return res.status(400).json({ msg: "Something went wrong" });

  const inst = await AcademicStaff.findOne({ member: req.user.id });
  if (!inst) return res.status(400).json({ msg: "Something went wrong" });

  const thecourse = await course.findOne({ id: courseID });
  if (!thecourse) return res.status(400).json({ msg: 'The course does not exist' });

  const removedStaffMember = await StaffMember.findOne({ id: academicMemberID });
  if (!removedStaffMember) return res.status(400).json({ msg: 'There is no staff member with this id' });

  const removedAcademicMember = await AcademicStaff.findOne({ member: removedStaffMember._id });
  if (!removedAcademicMember) return res.status(400).json({ msg: 'The staff member is not an academic member' });

  if (inst.type == 'Course Instructor') {
    var assigned = false;
    const coursesAssigned = inst.courses;
    for (var i = 0; i < coursesAssigned.length; i++) {
      if (coursesAssigned[i].equals(thecourse._id)) {
        assigned = true;
        break;
      }
    }

    if (!assigned) return res.status(403).json({ msg: 'You are not assigned to this course' });

    var removedAssigned = false;
    var position = -1;

    for (var i = 0; i < thecourse.academic_staff.length; i++) {
      if (thecourse.academic_staff[i].equals(removedAcademicMember._id)) {
        position = i;
        removedAssigned = true;
        break;
      }
    }
    if (!removedAssigned) return res.status(400).json({ msg: 'The academic member you want to remove is not assigned to this course' });

    thecourse.academic_staff.splice(position, 1);
    const withoutRemoved = thecourse.schedule.filter((slot) => {
      if (slot.academic_member_id) return !slot.academic_member_id.equals(removedAcademicMember._id)
      else return true
    });
    const slotsRemovedNum = thecourse.slots_covered - withoutRemoved.length;
    thecourse.slots_covered -= slotsRemovedNum;
    thecourse.schedule = withoutRemoved;
    await thecourse.save();

    for (var i = 0; i < removedAcademicMember.courses.length; i++) {
      if (removedAcademicMember.courses[i].equals(thecourse._id)) {
        position = i;
        break;
      }
    }

    removedAcademicMember.courses.splice(position, 1);
    const withoutRemovedCourses = removedAcademicMember.schedule.filter((slot) => {
      if (slot.course) return !slot.course.equals(thecourse._id)
    });
    removedAcademicMember.schedule = withoutRemovedCourses;
    await removedAcademicMember.save();

    return res.status(200).json({ msg: 'Operation successful' });
  }
  else return res.status(401).json({ msg: 'Access Denied' });
});

//assign course coordinator
router.put("/assigncoordinator", authenticateToken, async (req, res) => {
  try {
    const instr = await StaffMember.findOne({ _id: req.user.id });
    //make sure instr is not null elawl
    if (instr == null) res.status(400).send({ msg: "something went wrong finding Staff account" });
    else {
      const inst = await AcademicStaff.findOne({ member: instr._id });

      //for testing
      //    const instr=await StaffMember.findOne({"id":"ac-1"});
      //    const inst=await AcademicStaff.findOne({"member":instr._id});
      // end
      if (inst == null) res.status(400).send({ msg: "Something went wrong finding academic account" });
      else {
        if (inst.type === "Course Instructor") {
          const { courseid, coordinatorid } = req.body;
          if (!courseid || !coordinatorid)
            res.status(400).send({ msg: "please fill all the fields" });
          else {
            const thecourse = await course.findOne({ id: courseid });
            if (thecourse == null){
              res
                .status(400)
                .send({ msg: "the course id you entered is incorrect" });
                return;
            }
            else {
              const thec = await StaffMember.findOne({ id: coordinatorid });
              if (thec == null){
                res
                  .status(400)
                  .send({ msg: "the coordinator id you entered is incorrect" });
                  return;
              }
              else {
                const thecoordinator = await AcademicStaff.findOne({
                  member: thec._id,
                });
                if (
                  thecoordinator == null ||
                  thecoordinator.type != "Teaching Assistant"
                )
                  res
                    .status(400)
                    .send({
                      msg: "the coordinator id you entered is incorrect",
                    });
                else {
                  //make sure it's his/her course
                  var assigned = false;
                  const courses = await inst.courses;
                  for (var i = 0; i < courses.length; i++) {
                    if (thecourse._id.toString() === courses[i].toString()) {
                      assigned = true;
                      break;
                    }
                  }
                  if (assigned) {
                    //make sure the coordinater is a teaching assistant of this course
                    var coassigned = false;
                    const cocourses = thecoordinator.courses;
                    for (var i = 0; i < cocourses.length; i++) {
                      if (thecourse._id.toString() === cocourses[i].toString()) {
                        coassigned = true;
                        break;
                      }
                    }
                    if (coassigned) {
                      if (thecourse.course_coordinator !== null) {
                        const oldcoordinater = await AcademicStaff.findOne({
                          _id: thecourse.course_coordinator,
                        });
                        oldcoordinater.isCourseCoordinator = false;
                        await oldcoordinater.save();
                      }
                      thecourse.course_coordinator = thecoordinator._id;
                      thecoordinator.isCourseCoordinator = true;
                      await thecoordinator.save();
                      await thecourse.save();
                      res.send({msg:"Assignment Successful"});
                    } else
                      res
                        .status(400)
                        .send({
                          msg:
                            "the staffmember you entered is not assigned to this course",
                        });
                  } else
                    res
                      .status(400)
                      .send({ msg: "your not assigned to this course." });
                }
              }
            }
          }
        } else res.status(400).send({ msg: "Access denied" });
      }
    }
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// ADDED ROUTES FOR FRONT-END DISPLAY # MARK
router.get("/getcoursestaff", authenticateToken, async (req, res) => {
  const cid = req.query.cid;
  console.log(cid);
  try {
    const st = await StaffMember.findOne({ _id: req.user.id });
    if (!st) {
      console.log(" NO STAFF FOUND ");
      res.status(400).send({ msg: "NO STAFF MEMBER FOUND WITH THAT ID" });
      return;
    }
    if (!cid) {
      res.status(400).send({ msg: "Course ID Missing!" });
      return;
    }
    const curCor={
      name:"",
      id:""
    }
    const cor = await course.findOne({ id: cid });
    console.log(cor.course_coordinator);
    const x=await AcademicStaff.findOne({_id:cor.course_coordinator});
    console.log()
    if(x){
      const y=await StaffMember.findOne({_id:x.member});
      console.log(y)
      curCor.name=y.name;
      curCor.id=y.id;
    }
    console.log(curCor)
    if (!cor) {
      res.status(400).send({ msg: "No Course found for that ID" });
      return;
    }
    const acad = cor.academic_staff;
    const staff = [];
    
    for(let i=0;i<acad.length;i++){
      let a=acad[i];
      try {
        const ac = await AcademicStaff.findOne({ _id: a });
        const m = await StaffMember.findOne({ _id: ac.member });

        if (ac.type === "Teaching Assistant") {
          const account = {
            name: m.name,
            acadId: ac._id,
            id:m.id,
          };
          staff.push(account)
        
        }
      } catch (err) {
        console.log("FINDING ACADEMIC PROFILE ERROR ");
      }
    };
    

    res.send({staff:staff,curCor:curCor});
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ msg: err.message });
    return;
  }
});

module.exports = router;
