
const express = require("express");
const router = express.Router();
const Application = require("../models/Application");

// Get all applications
router.get("/", async (req, res) => {
  try {
    const applications = await Application.find().sort({
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      message: "Applications retrieved successfully",
      data: applications
    });
  } catch (error) {
    console.error("Get applications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve applications",
      data: null
    });
  }
});

// Create and save an application
router.post("/", async (req, res) => {
  try {
    const {
      companyName,
      jobRole,
      jobType,
      appliedDate,
      expectedSalary,
      notes
    } = req.body;

    if (
      !companyName?.trim() ||
      !jobRole?.trim() ||
      !jobType ||
      !appliedDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Company name, job role, job type and applied date are required",
        data: null
      });
    }

    const date = new Date(appliedDate);

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid applied date",
        data: null
      });
    }

    if (date > new Date()) {
      return res.status(400).json({
        success: false,
        message: "Applied date cannot be in the future",
        data: null
      });
    }

    const application = await Application.create({
      companyName: companyName.trim(),
      jobRole: jobRole.trim(),
      jobType,
      appliedDate: date,
      expectedSalary:
        expectedSalary === "" || expectedSalary == null
          ? null
          : Number(expectedSalary),
      notes: notes || "",
      status: "Applied"
    });

    return res.status(201).json({
      success: true,
      message: "Application saved successfully",
      data: application
    });
  } catch (error) {
    console.error("Create application error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save application",
      data: null
    });
  }
});

// Delete an application
router.delete("/:id", async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(
      req.params.id
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application deleted successfully",
      data: application
    });
  } catch (error) {
    console.error("Delete application error:", error);

    return res.status(400).json({
      success: false,
      message: "Invalid application ID or delete failed",
      data: null
    });
  }
});

module.exports = router;
