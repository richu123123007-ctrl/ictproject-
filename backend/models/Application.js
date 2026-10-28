
const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: 100
    },

    jobRole: {
      type: String,
      required: [true, "Job role is required"],
      trim: true,
      maxlength: 100
    },

    jobType: {
      type: String,
      required: [true, "Job type is required"],
      enum: ["Full-time", "Internship", "Contract"],
      required: true
    },

    appliedDate: {
      type: Date,
      required: [true, "Applied date is required"],
      validate: {
        validator: function (value) {
          if (!value) return false;

          const today = new Date();
          today.setHours(23, 59, 59, 999);

          return value <= today;
        },
        message: "Applied date cannot be in the future"
      }
    },

    expectedSalary: {
      type: Number,
      default: null,
      min: 0
    },

    notes: {
      type: String,
      default: "",
      maxlength: 1000
    },

    status: {
      type: String,
      enum: [
        "Applied",
        "Interview",
        "Offer",
        "Accepted",
        "Rejected",
        "Declined"
      ],
      default: "Applied"
    },

    applicationId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    followUpDate: {
      type: Date,
      default: function () {
        if (!this.appliedDate) return undefined;

        const date = new Date(this.appliedDate);
        date.setDate(date.getDate() + 7);
        return date;
      }
    },

    history: [
      {
        status: {
          type: String,
          enum: [
            "Applied",
            "Interview",
            "Offer",
            "Accepted",
            "Rejected",
            "Declined"
          ],
          required: true
        },
        date: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

applicationSchema.pre("save", function () {
  if (this.isNew && this.history.length === 0) {
    this.history.push({
      status: this.status,
      date: new Date()
    });
  }
});

module.exports = mongoose.model("Application", applicationSchema);
