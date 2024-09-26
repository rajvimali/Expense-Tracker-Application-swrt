// controllers/expenseController.js
const Expense = require("../models/Expense");
const csv = require("csvtojson");

// Add a single expense
exports.addExpense = async (req, res) => {
  const { description, amount, category, paymentMethod, date } = req.body;

  try {
    const expense = new Expense({
      description,
      amount,
      category,
      paymentMethod,
      date,
      createdBy: req.user._id, // Ensure the user is logged in
    });

    await expense.save();
    res.status(201).json({ message: "Expense added successfully", expense });
  } catch (error) {
    res.status(400).json({ message: "Error adding expense", error });
  }
};

// Add multiple expenses via CSV upload
exports.addBulkExpenses = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a CSV file" });
  }

  try {
    const expenses = await csv().fromFile(req.file.path);

    const expensesToAdd = expenses.map((expense) => ({
      ...expense,
      createdBy: req.user._id, // Attach the logged-in user
    }));

    await Expense.insertMany(expensesToAdd);
    res.status(201).json({ message: "Bulk expenses added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error adding bulk expenses", error });
  }
};

// Get all expenses with filtering, sorting, and pagination
exports.getExpenses = async (req, res) => {
  const {
    category,
    paymentMethod,
    startDate,
    endDate,
    sortBy,
    order,
    page,
    limit,
  } = req.query;

  const filter = { createdBy: req.user._id }; // Only show the logged-in user's expenses

  if (category) {
    filter.category = category;
  }

  if (paymentMethod) {
    filter.paymentMethod = paymentMethod;
  }

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const sort = {};
  if (sortBy) {
    sort[sortBy] = order === "desc" ? -1 : 1;
  }

  const currentPage = parseInt(page, 10) || 1;
  const pageSize = parseInt(limit, 10) || 10;

  try {
    const expenses = await Expense.find(filter)
      .sort(sort)
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    const totalExpenses = await Expense.countDocuments(filter);

    res.json({
      expenses,
      currentPage,
      totalPages: Math.ceil(totalExpenses / pageSize),
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching expenses", error });
  }
};

// Update an expense (Partial update using PATCH)
exports.updateExpense = async (req, res) => {
  const { id } = req.params;

  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: id, createdBy: req.user._id },
      req.body,
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ message: "Expense updated successfully", expense });
  } catch (error) {
    res.status(400).json({ message: "Error updating expense", error });
  }
};

// Delete a single or multiple expenses
exports.deleteExpenses = async (req, res) => {
  const { ids } = req.body; // ids should be an array of expense IDs to delete

  try {
    await Expense.deleteMany({ _id: { $in: ids }, createdBy: req.user._id });
    res.json({ message: "Expenses deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting expenses", error });
  }
};

// Expense statistics (Aggregation)
exports.getExpenseStats = async (req, res) => {
  try {
    const stats = await Expense.aggregate([
      { $match: { createdBy: req.user._id } }, // Filter by user
      {
        $group: {
          _id: { month: { $month: "$date" }, year: { $year: "$date" } },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }, // Sort by most recent
    ]);

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: "Error fetching statistics", error });
  }
};
