import { useEffect, useMemo, useState } from "react";
import "./App.css";

// Use the deployed Render API in production.
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const API = `${API_BASE_URL}/api/applications`;

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const emptyForm = {
  companyName: "",
  jobRole: "",
  jobType: "Full-time",
  appliedDate: getToday(),
  expectedSalary: "",
  notes: "",
};

async function readResponse(response) {
  const text = await response.text();

  let result;
  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      "The server returned an invalid response. Please try again."
    );
  }

  if (!response.ok) {
    throw new Error(
      result.message || `Request failed with status ${response.status}.`
    );
  }

  return result;
}

function App() {
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadApplications() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API);
      const result = await readResponse(response);

      setApplications(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error("Load applications error:", err);
      setError(
        "Cannot connect to the applications API. Check the Render backend URL, CORS settings, and backend logs."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const searchText =
        `${app.companyName || ""} ${app.jobRole || ""}`.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesFilter = filter === "All" || app.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [applications, search, filter]);

  const counts = {
    total: applications.length,
    Applied: applications.filter((app) => app.status === "Applied").length,
    Interview: applications.filter((app) => app.status === "Interview").length,
    Offer: applications.filter((app) => app.status === "Offer").length,
  };

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (
      !form.companyName.trim() ||
      !form.jobRole.trim() ||
      !form.appliedDate
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.appliedDate > getToday()) {
      setError("Applied date cannot be in the future.");
      return;
    }

    const payload = {
      ...form,
      companyName: form.companyName.trim(),
      jobRole: form.jobRole.trim(),
      expectedSalary:
        form.expectedSalary === "" ? null : Number(form.expectedSalary),
    };

    if (
      payload.expectedSalary !== null &&
      (!Number.isFinite(payload.expectedSalary) || payload.expectedSalary < 0)
    ) {
      setError("Expected salary must be a valid non-negative number.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await readResponse(response);

      if (!result.data || !result.data._id) {
        throw new Error(
          "The backend did not return a saved application. Check your backend POST route."
        );
      }

      setForm({
        ...emptyForm,
        appliedDate: getToday(),
      });
      setShowForm(false);
      setMessage("Application saved successfully.");

      // Reload the actual database records.
      await loadApplications();
    } catch (err) {
      console.error("Create application error:", err);
      setError(err.message || "Unable to add application.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteApplication(id) {
    if (!id) {
      setError("This application does not have a valid database ID.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this application?")) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );

      await readResponse(response);

      setApplications((current) =>
        current.filter((app) => app._id !== id)
      );
      setMessage("Application deleted successfully.");
    } catch (err) {
      console.error("Delete application error:", err);
      setError(
        err.message ||
          "Unable to delete this application. Check that the backend DELETE route is implemented."
      );
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">J</div>
          <div>
            <strong>JobTrack</strong>
            <span>CAREER DASHBOARD</span>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <button className="nav-item active" type="button">
          <span>▦</span> Dashboard
        </button>

        <button
          className="nav-item"
          type="button"
          onClick={() => {
            setError("");
            setMessage("");
            setShowForm(true);
          }}
        >
          <span>＋</span> Add application
        </button>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">✦</span>
            <strong>Keep moving forward</strong>
            <p>
              Every application is a step toward your next opportunity.
            </p>
          </div>

          <div className="profile">
            <div className="avatar">JD</div>
            <div>
              <strong>Job Seeker</strong>
              <span>Career workspace</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> Dashboard
          </div>

          <div className="topbar-right">
            <span className="live-dot"></span>
            <span>Application overview</span>
          </div>
        </header>

        <section className="welcome-row">
          <div>
            <p className="eyebrow">YOUR CAREER JOURNEY</p>
            <h1>Job application tracker</h1>
            <p className="subtitle">
              Stay organized, track progress, and get closer to your next role.
            </p>
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setError("");
              setMessage("");
              setShowForm(true);
            }}
          >
            <span>＋</span> Add application
          </button>
        </section>

        {error && (
          <div className="alert error-alert" role="alert">
            {error}
            <button
              type="button"
              onClick={loadApplications}
              disabled={loading}
              style={{
                marginLeft: "12px",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {message && (
          <div className="alert success-alert" role="status">
            {message}
          </div>
        )}

        <section className="stats-grid">
          <StatCard
            title="Total applications"
            value={counts.total}
            icon="▤"
            color="purple"
          />
          <StatCard
            title="Applied"
            value={counts.Applied}
            icon="↗"
            color="blue"
          />
          <StatCard
            title="Interviews"
            value={counts.Interview}
            icon="▣"
            color="orange"
          />
          <StatCard
            title="Offers"
            value={counts.Offer}
            icon="✧"
            color="green"
          />
        </section>

        <section className="applications-panel">
          <div className="panel-heading">
            <div>
              <h2>Your applications</h2>
              <p>Manage and follow up on your job opportunities.</p>
            </div>

            <span className="count-pill">
              {filteredApplications.length} records
            </span>
          </div>

          <div className="toolbar">
            <div className="search-box">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search company or job role..."
                aria-label="Search applications"
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter by status"
            >
              {[
                "All",
                "Applied",
                "Interview",
                "Offer",
                "Accepted",
                "Rejected",
                "Declined",
              ].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="empty-icon">↻</div>
              <h3>Loading applications...</h3>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">▤</div>
              <h3>No applications found</h3>
              <p>
                Add your first application or try changing your search.
              </p>
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  setError("");
                  setMessage("");
                  setShowForm(true);
                }}
              >
                ＋ Add your first application
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>COMPANY / ROLE</th>
                    <th>JOB TYPE</th>
                    <th>APPLIED DATE</th>
                    <th>STATUS</th>
                    <th>SALARY</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app._id}>
                      <td>
                        <div className="company-cell">
                          <div className="company-logo">
                            {(app.companyName || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>{app.companyName}</strong>
                            <span>{app.jobRole}</span>
                            {app.applicationId && (
                              <small>{app.applicationId}</small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>{app.jobType || "—"}</td>

                      <td>
                        {app.appliedDate
                          ? String(app.appliedDate).slice(0, 10)
                          : "—"}
                      </td>

                      <td>
                        <StatusBadge status={app.status || "Applied"} />
                      </td>

                      <td>
                        {app.expectedSalary != null &&
                        app.expectedSalary !== ""
                          ? Number(app.expectedSalary).toLocaleString()
                          : "—"}
                      </td>

                      <td>
                        <button
                          className="delete-button"
                          type="button"
                          onClick={() => deleteApplication(app._id)}
                          title="Delete application"
                          aria-label={`Delete ${app.companyName}`}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="footer">
          <span>
            JobTrack <span className="footer-dot">•</span> Your career,
            organized.
          </span>
          <span>Made for your next opportunity</span>
        </footer>
      </main>

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <section
            className="form-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-title"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">NEW OPPORTUNITY</p>
                <h2 id="form-title">Add application</h2>
                <p>Enter the details of the role you're applying for.</p>
              </div>

              <button
                className="close-button"
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Company name <span>*</span>
                <input
                  name="companyName"
                  value={form.companyName}
                  onChange={updateField}
                  required
                  maxLength={100}
                  placeholder="e.g. Google"
                />
              </label>

              <label>
                Job role <span>*</span>
                <input
                  name="jobRole"
                  value={form.jobRole}
                  onChange={updateField}
                  required
                  maxLength={100}
                  placeholder="e.g. Frontend Developer"
                />
              </label>

              <div className="form-row">
                <label>
                  Job type <span>*</span>
                  <select
                    name="jobType"
                    value={form.jobType}
                    onChange={updateField}
                    required
                  >
                    <option>Full-time</option>
                    <option>Internship</option>
                    <option>Contract</option>
                  </select>
                </label>

                <label>
                  Applied date <span>*</span>
                  <input
                    type="date"
                    name="appliedDate"
                    value={form.appliedDate}
                    onChange={updateField}
                    max={getToday()}
                    required
                  />
                </label>
              </div>

              <label>
                Expected salary{" "}
                <span className="optional">(optional)</span>
                <input
                  name="expectedSalary"
                  type="number"
                  min="0"
                  value={form.expectedSalary}
                  onChange={updateField}
                  placeholder="e.g. 600000"
                />
              </label>

              <label>
                Notes <span className="optional">(optional)</span>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={updateField}
                  rows={3}
                  maxLength={1000}
                  placeholder="Add interview details, contact person, or reminders..."
                />
              </label>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save application"}
                  {!saving && <span> →</span>}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
      </div>
      <span className="stat-decoration">↗</span>
    </article>
  );
}

function StatusBadge({ status }) {
  const className = String(status).toLowerCase();
  return (
    <span className={`status-badge ${className}`}>
      {status}
    </span>
  );
}

export default App;