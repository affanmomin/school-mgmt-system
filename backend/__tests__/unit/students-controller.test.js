// Unit tests for the students controller wired up in
// `feat(students): implement CRUD controller handlers`.
//
// The service layer is mocked so each test only verifies the controller's
// own job: pull the right pieces out of the request, hand them to the
// right service function, and return the right shape on success.

jest.mock("../../src/modules/students/students-service");

const {
  getAllStudents,
  addNewStudent,
  getStudentDetail,
  setStudentStatus,
  updateStudent,
} = require("../../src/modules/students/students-service");

const {
  handleGetAllStudents,
  handleAddStudent,
  handleGetStudentDetail,
  handleStudentStatus,
  handleUpdateStudent,
} = require("../../src/modules/students/students-controller");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("students-controller", () => {
  describe("handleGetAllStudents", () => {
    it("forwards query filters and returns { students }", async () => {
      const students = [{ id: 1, name: "Jane" }];
      getAllStudents.mockResolvedValue(students);

      const req = { query: { name: "Jane", className: "One", section: "A", roll: "1" } };
      const res = mockRes();

      await handleGetAllStudents(req, res, jest.fn());

      expect(getAllStudents).toHaveBeenCalledWith({
        name: "Jane",
        className: "One",
        section: "A",
        roll: "1",
      });
      expect(res.json).toHaveBeenCalledWith({ students });
    });

    it("propagates service errors via next() (asyncHandler)", async () => {
      const boom = new Error("db down");
      getAllStudents.mockRejectedValue(boom);

      const req = { query: {} };
      const res = mockRes();
      const next = jest.fn();

      await handleGetAllStudents(req, res, next);

      expect(next).toHaveBeenCalledWith(boom);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("handleAddStudent", () => {
    it("passes req.body through to addNewStudent and returns its message", async () => {
      const message = { message: "Student added successfully" };
      addNewStudent.mockResolvedValue(message);

      const req = { body: { name: "Jane", email: "jane@example.com" } };
      const res = mockRes();

      await handleAddStudent(req, res, jest.fn());

      expect(addNewStudent).toHaveBeenCalledWith(req.body);
      expect(res.json).toHaveBeenCalledWith(message);
    });
  });

  describe("handleGetStudentDetail", () => {
    it("looks up the student by req.params.id and returns the record", async () => {
      const student = { id: 7, name: "Jane" };
      getStudentDetail.mockResolvedValue(student);

      const req = { params: { id: "7" } };
      const res = mockRes();

      await handleGetStudentDetail(req, res, jest.fn());

      expect(getStudentDetail).toHaveBeenCalledWith("7");
      expect(res.json).toHaveBeenCalledWith(student);
    });
  });

  describe("handleUpdateStudent", () => {
    // The student_add_update SP keys off `userId` to decide insert vs update.
    // The controller is responsible for merging req.params.id in as `userId`
    // so the SP treats the call as an update.
    it("merges req.params.id as userId into the body", async () => {
      const message = { message: "Student updated successfully" };
      updateStudent.mockResolvedValue(message);

      const req = { params: { id: "42" }, body: { name: "Jane Renamed" } };
      const res = mockRes();

      await handleUpdateStudent(req, res, jest.fn());

      expect(updateStudent).toHaveBeenCalledWith({
        name: "Jane Renamed",
        userId: "42",
      });
      expect(res.json).toHaveBeenCalledWith(message);
    });
  });

  describe("handleStudentStatus", () => {
    // Status changes need: target user (params.id), reviewer (req.user.id
    // from authenticate-token), and the new status (body).
    it("combines target id, reviewer id, and status", async () => {
      const message = { message: "Student status changed successfully" };
      setStudentStatus.mockResolvedValue(message);

      const req = {
        params: { id: "42" },
        user: { id: 1, role: "admin" },
        body: { status: false },
      };
      const res = mockRes();

      await handleStudentStatus(req, res, jest.fn());

      expect(setStudentStatus).toHaveBeenCalledWith({
        userId: "42",
        reviewerId: 1,
        status: false,
      });
      expect(res.json).toHaveBeenCalledWith(message);
    });
  });
});
