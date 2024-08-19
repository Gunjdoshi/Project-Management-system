import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

function Home() {
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "Not started",
  });
  const [editProjectId, setEditProjectId] = useState(null);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Redirects to Login page if directly try going to the home page
  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    fetch(`http://localhost:8800/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then((response) => response.json())
    .then((data) => {
      setProjects(data);
    })
    .catch((error) => console.error("Error fetching projects:", error));

    fetch("http://localhost:8800/user", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        setUserName(data.username);
      })
      .catch((error) => console.error("Error fetching user details:", error));
  }, [token, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const method = editProjectId ? "PUT" : "POST";
    const endpoint = editProjectId ? `http://localhost:8800/projects/${editProjectId}` : "http://localhost:8800/projects";
    
    fetch(endpoint, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message.includes("successfully")) {
          fetch(`http://localhost:8800/projects`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
            .then((response) => response.json())
            .then((data) => setProjects(data))
            .catch((error) => console.error("Error fetching projects:", error));
          setEditProjectId(null);
          setFormData({
            title: "",
            description: "",
            status: "Not started",
          });
        }
      })
      .catch((error) => console.error("Error submitting project:", error));
  };

  const handleEdit = (project) => {
    setEditProjectId(project.id);
    setFormData({
      title: project.title,
      description: project.description,
      status: project.status,
    });
  };

  const handleDelete = (projectId) => {
    fetch(`http://localhost:8800/projects/${projectId}`, {
      method: "DELETE",
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === "Project deleted successfully") {
          fetch(`http://localhost:8800/projects`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
            .then((response) => response.json())
            .then((data) => setProjects(data))
            .catch((error) => console.error("Error fetching projects:", error));
        }
      })
      .catch((error) => console.error("Error deleting project:", error));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate("/");
  };

  const renderProjectsByStatus = (status) => {
    return projects
      .filter((project) => project.status === status)
      .map((project) => (
        <div key={project.id} className="project">
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <p>Status: {project.status}</p>
          <button onClick={() => handleEdit(project)}>Edit</button>
          <button onClick={() => handleDelete(project.id)}>Delete</button>
        </div>
      ));
  };

  return (
    <div className="home-container">
      <div className="header">
        <span className="user-name">You have successfully logged in.</span>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>

      <h1>Track your progress here!</h1>
      

      <div className="project-form-container">
        <h2>{editProjectId ? "Edit Project" : "Create a new project"}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Title:
            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
          </label>
          <label>
            Description:
            <textarea name="description" value={formData.description} onChange={handleChange} required />
          </label>
          <label>
            Status:
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="Not started">Not started</option>
              <option value="In progress">In progress</option>
              <option value="Completed">Completed</option>
            </select>
          </label>
          <button type="submit">{editProjectId ? "Update Project" : "Create Project"}</button>
        </form>
      </div>

      <div className="project-columns">
        <div className="project-column">
          <h2>Not Started</h2>
          {renderProjectsByStatus("Not started")}
        </div>

        <div className="project-column">
          <h2>In Progress</h2>
          {renderProjectsByStatus("In progress")}
        </div>

        <div className="project-column">
          <h2>Completed</h2>
          {renderProjectsByStatus("Completed")}
        </div>
      </div>
    </div>
  );
}

export default Home;
