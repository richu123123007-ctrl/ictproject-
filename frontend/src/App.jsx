
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api/applications";

const emptyForm = {
  companyName: "",
  jobRole: "",
  jobType: "Full-time",
  appliedDate: new Date().toLocaleDateString("en-CA"),
  expectedSalary: "",
  notes: "",
};

function App() {
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadApplications() {
    try {
      const response = await fetch(API);
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Could not load applications");

      setApplications(Array.isArray(result.data) ? result.data : []);
    } catch {
      setError("Cannot connect to the applications API. Check that your backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch = `${app.companyName || ""} ${app.jobRole || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesSearch && (filter === "All" || app.status === filter);
    });
  }, [applications, search, filter]);

  const counts = {
    total: applications.length,
    Applied: applications.filter((a) => a.status === "Applied").length,
    Interview: applications.filter((a) => a.status === "Interview").length,
    Offer: applications.filter((a) => a.status === "Offer").length,
  };

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.companyName.trim() || !form.jobRole.trim() || !form.appliedDate) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.appliedDate > new Date().toLocaleDateString("en-CA")) {
      setError("Applied date cannot be in the future.");
      return;
    }

    const payload = {
      ...form,
      companyName: form.companyName.trim(),
      jobRole: form.jobRole.trim(),
      expectedSalary: form.expectedSalary === "" ? null : Number(form.expectedSalary),
    };

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not create application.");
      }

      // The temporary backend echoes the submitted form.
      // A complete backend should return the saved MongoDB document.
      const saved = {
        ...payload,
        ...result.data,
        _id: result.data?._id || `temporary-${Date.now()}`,
        status: result.data?.status || "Applied",
        applicationId: result.data?.applicationId || "Pending backend ID",
      };

      setApplications((current) => [saved, ...current]);
      setForm(emptyForm);
      setShowForm(false);
      setMessage("Application added to the current view.");
    } catch (err) {
      setError(err.message || "Unable to add application.");
    }
  }

  async function deleteApplication(id) {
    if (!window.confirm("Are you sure you want to delete this application?")) return;

    try {
      const response = await fetch(`${API}/${id}`, { method: "DELETE" });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Delete failed.");

      setApplications((current) => current.filter((app) => app._id !== id));
      setMessage("Application deleted.");
    } catch (err) {
      setError(
        err.message || "Delete is not available until the backend delete route is implemented."
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
          onClick={() => setShowForm(true)}
        >
          <span>＋</span> Add application
        </button>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">✦</span>
            <strong>Keep moving forward</strong>
            <p>Every application is a step toward your next opportunity.</p>
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
          <div className="breadcrumb">Workspace <span>/</span> Dashboard</div>
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
          <button className="primary-button" onClick={() => setShowForm(true)}>
            <span>＋</span> Add application
          </button>
        </section>

        {error && <div className="alert error-alert">{error}</div>}
        {message && <div className="alert success-alert">{message}</div>}

        <section className="stats-grid">
          <StatCard title="Total applications" value={counts.total} icon="▤" color="purple" />
          <StatCard title="Applied" value={counts.Applied} icon="↗" color="blue" />
          <StatCard title="Interviews" value={counts.Interview} icon="▣" color="orange" />
          <StatCard title="Offers" value={counts.Offer} icon="✧" color="green" />
        </section>

        <section className="applications-panel">
          <div className="panel-heading">
            <div>
              <h2>Your applications</h2>
              <p>Manage and follow up on your job opportunities.</p>
            </div>
            <span className="count-pill">{filteredApplications.length} records</span>
          </div>

          <div className="toolbar">
            <div className="search-box">
              <span>⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company or job role..."
                aria-label="Search applications"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter by status"
            >
              {["All", "Applied", "Interview", "Offer", "Accepted", "Rejected", "Declined"].map(
                (status) => <option key={status}>{status}</option>
              )}
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
              <p>Add your first application or try changing your search.</p>
              <button className="primary-button" onClick={() => setShowForm(true)}>
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
                            {(app.companyName || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong>{app.companyName}</strong>
                            <span>{app.jobRole}</span>
                            {app.applicationId && app.applicationId !== "Pending backend ID" && (
                              <small>{app.applicationId}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{app.jobType}</td>
                      <td>{app.appliedDate ? String(app.appliedDate).slice(0, 10) : "—"}</td>
                      <td><StatusBadge status={app.status || "Applied"} /></td>
                      <td>{app.expectedSalary ? Number(app.expectedSalary).toLocaleString() : "—"}</td>
                      <td>
                        <button
                          className="delete-button"
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
          <span>JobTrack <span className="footer-dot">•</span> Your career, organized.</span>
          <span>Made for your next opportunity</span>
        </footer>
      </main>

      {showForm && (
        <div className="modal-backdrop" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setShowForm(false);
        }}>
          <section className="form-modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">NEW OPPORTUNITY</p>
                <h2 id="form-title">Add application</h2>
                <p>Enter the details of the role you're applying for.</p>
              </div>
              <button className="close-button" onClick={() => setShowForm(false)} aria-label="Close form">×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Company name <span>*</span>
                <input name="companyName" value={form.companyName} onChange={updateField} required maxLength="100" placeholder="e.g. Google" />
              </label>

              <label>
                Job role <span>*</span>
                <input name="jobRole" value={form.jobRole} onChange={updateField} required maxLength="100" placeholder="e.g. Frontend Developer" />
              </label>

              <div className="form-row">
                <label>
                  Job type <span>*</span>
                  <select name="jobType" value={form.jobType} onChange={updateField} required>
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
                    max={new Date().toLocaleDateString("en-CA")}
                    required
                  />
                </label>
              </div>

              <label>
                Expected salary <span className="optional">(optional)</span>
                <input name="expectedSalary" type="number" min="0" value={form.expectedSalary} onChange={updateField} placeholder="e.g. 600000" />
              </label>

              <label>
                Notes <span className="optional">(optional)</span>
                <textarea name="notes" value={form.notes} onChange={updateField} rows="3" maxLength="1000" placeholder="Add interview details, contact person, or reminders..." />
              </label>

              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save application <span>→</span></button>
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
  const className = status.toLowerCase();
  return <span className={`status-badge ${className}`}>{status}</span>;
}

export default App;
