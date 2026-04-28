// Integration test for the /api/v1/students CRUD surface.
//
// Exercises the real Express app: router -> middleware chain -> controller
// -> service. Only the boundaries (auth middleware, repository) are mocked,
// so this catches wiring mistakes a pure unit test would miss (e.g. the
// router forgetting checkApiAccess, the service contract drifting from
// the controller's expectations, etc.).
//
// Boundaries mocked:
//   - authenticate-token  -> set req.user = { id: 1, roleId: 1 } and pass
//   - csrf-protection     -> pass (we don't want to forge JWTs in tests)
//   - check-api-access    -> not mocked; admin bypasses by roleId === 1
//   - sendAccountVerificationEmail -> no-op (no real Resend calls)
//   - DB repository       -> no real Postgres connection
//
// Everything else (routing, validation, the controllers we wrote, the
// service-layer ApiError logic) runs for real.

jest.mock("../../src/middlewares/authenticate-token", () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: 1, role: "admin", roleId: 1 };
    next();
  },
}));

jest.mock("../../src/middlewares/csrf-protection", () => ({
  csrfProtection: (_req, _res, next) => next(),
}));

jest.mock("../../src/utils/send-account-verification-email", () => ({
  sendAccountVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../src/modules/students/students-repository", () => ({
  getRoleId: jest.fn(),
  findAllStudents: jest.fn(),
  addOrUpdateStudent: jest.fn(),
  findStudentDetail: jest.fn(),
  findStudentToSetStatus: jest.fn(),
}));

jest.mock("../../src/shared/repository", () => ({
  findUserById: jest.fn(),
}));

const request = require("supertest");
const { app } = require("../../src/app");
const repo = require("../../src/modules/students/students-repository");
const shared = require("../../src/shared/repository");

describe("integration: /api/v1/students", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /students", () => {
    it("returns the list when the repo finds students", async () => {
      repo.findAllStudents.mockResolvedValue([
        { id: 1, name: "Jane", email: "jane@example.com" },
        { id: 2, name: "Joe", email: "joe@example.com" },
      ]);

      const res = await request(app).get("/api/v1/students");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        students: [
          { id: 1, name: "Jane", email: "jane@example.com" },
          { id: 2, name: "Joe", email: "joe@example.com" },
        ],
      });
      expect(repo.findAllStudents).toHaveBeenCalledTimes(1);
    });

    it("forwards query filters into the repository call", async () => {
      repo.findAllStudents.mockResolvedValue([{ id: 1 }]);

      await request(app)
        .get("/api/v1/students")
        .query({ name: "Jane", className: "One", section: "A", roll: "1" });

      expect(repo.findAllStudents).toHaveBeenCalledWith({
        name: "Jane",
        className: "One",
        section: "A",
        roll: "1",
      });
    });

    it("returns 404 with the project's empty-list convention", async () => {
      repo.findAllStudents.mockResolvedValue([]);

      const res = await request(app).get("/api/v1/students");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Students not found" });
    });
  });

  describe("POST /students", () => {
    it("creates a student and returns the success message", async () => {
      repo.addOrUpdateStudent.mockResolvedValue({
        userId: 99,
        status: true,
        message: "Student added successfully",
      });

      const res = await request(app)
        .post("/api/v1/students")
        .send({
          name: "Jane Test",
          email: "jane.test@example.com",
          gender: "Female",
          phone: "123",
          dob: "2010-01-01",
          admissionDt: "2024-09-01",
          className: "One",
          sectionName: "A",
          roll: "1",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/Student added/);
      expect(repo.addOrUpdateStudent).toHaveBeenCalledTimes(1);
    });

    it("surfaces a 500 when the SP signals failure", async () => {
      repo.addOrUpdateStudent.mockResolvedValue({
        userId: null,
        status: false,
        message: "Email already exists",
      });

      const res = await request(app)
        .post("/api/v1/students")
        .send({ name: "Jane", email: "dup@example.com" });

      expect(res.status).toBe(500);
      // The service wraps the original error; the test just confirms a
      // structured ApiError reaches the client (vs a raw stack trace).
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("GET /students/:id", () => {
    it("returns the student detail when found", async () => {
      shared.findUserById.mockResolvedValue({ id: 7, name: "Jane" });
      repo.findStudentDetail.mockResolvedValue({
        id: 7,
        name: "Jane",
        email: "jane@example.com",
        class: "One",
        section: "A",
      });

      const res = await request(app).get("/api/v1/students/7");

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 7, name: "Jane", class: "One" });
      expect(shared.findUserById).toHaveBeenCalledWith("7");
      expect(repo.findStudentDetail).toHaveBeenCalledWith("7");
    });

    it("returns 404 when the user id does not exist", async () => {
      shared.findUserById.mockResolvedValue(null);

      const res = await request(app).get("/api/v1/students/9999");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Student not found" });
      expect(repo.findStudentDetail).not.toHaveBeenCalled();
    });
  });

  describe("PUT /students/:id", () => {
    it("merges path id as userId into the SP call", async () => {
      repo.addOrUpdateStudent.mockResolvedValue({
        userId: 42,
        status: true,
        message: "Student updated successfully",
      });

      const res = await request(app)
        .put("/api/v1/students/42")
        .send({ name: "Jane Renamed", className: "Two" });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/updated/);
      expect(repo.addOrUpdateStudent).toHaveBeenCalledWith({
        name: "Jane Renamed",
        className: "Two",
        userId: "42",
      });
    });
  });

  describe("POST /students/:id/status", () => {
    it("calls the repo with target user, reviewer, and status", async () => {
      shared.findUserById.mockResolvedValue({ id: 42, name: "Jane" });
      repo.findStudentToSetStatus.mockResolvedValue(1);

      const res = await request(app)
        .post("/api/v1/students/42/status")
        .send({ status: false });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/status/i);
      expect(repo.findStudentToSetStatus).toHaveBeenCalledWith({
        userId: "42",
        reviewerId: 1, // from the auth middleware mock
        status: false,
      });
    });

    it("returns 404 when the student id does not exist", async () => {
      shared.findUserById.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/v1/students/9999/status")
        .send({ status: false });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Student not found" });
      expect(repo.findStudentToSetStatus).not.toHaveBeenCalled();
    });
  });
});
