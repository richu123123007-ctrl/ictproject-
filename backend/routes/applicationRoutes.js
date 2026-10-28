
const express = require("express");
const router = express.Router();

// Test route: Get all applications
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Applications route is working",
    data: []
  });
});

// Test route: Create an application
router.post("/", (req, res) => {
  res.status(201).json({
    success: true,
    message: "Application route is working",
    data: req.body
  });
});

module.exports = router;
