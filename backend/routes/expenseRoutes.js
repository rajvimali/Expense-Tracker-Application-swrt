// routes/expenseRoutes.js
const express = require("express");
const {
  addExpense,
  addBulkExpenses,
  getExpenses,
  updateExpense,
  deleteExpenses,
  getExpenseStats,
} = require("../controllers/expenseController");
const { protect, authorize } = require("../middleware/authMiddleware");
const multer = require("multer"); // For handling CSV uploads

const router = express.Router();

const upload = multer({ dest: "uploads/" }); // Set destination for file uploads

// Route to add a single expense (Protected)
router.post("/add", protect, addExpense);

// Route to add bulk expenses via CSV upload (Protected)
router.post("/bulk", protect, upload.single("file"), addBulkExpenses);

// Route to get all expenses with filters, pagination, and sorting (Protected)
router.get("/", protect, getExpenses);

// Route to update an expense (Protected)
router.patch("/update/:id", protect, updateExpense);

// Route to delete multiple expenses (Protected)
router.delete("/delete", protect, deleteExpenses);

// Route to get expense statistics (Protected)
router.get("/stats", protect, getExpenseStats);

module.exports = router;
