import React, { useState,useEffect } from "react";
import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";
import style from "./App.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UploadDetailsPage = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [resumeDetails, setResumeDetails] = useState("");
    const [uploadMessage, setUploadMessage] = useState("");
    const [saveMessage, setSaveMessage] = useState("");
    const [newSkill, setNewSkill] = useState("");
    const [extractionMethod, setExtractionMethod] = useState("javascript");
    const [uploading, setUploading] = useState(false);

    const handleRemoveSkill = (index) => {
        const updatedSkills = [...resumeDetails.skills];
        updatedSkills.splice(index, 1);
        setResumeDetails({ ...resumeDetails, skills: updatedSkills });
      };
    
      const handleNewSkillChange = (event) => {
        setNewSkill(event.target.value);
      };
    
      const handleAddSkill = () => {
        if (newSkill.trim() === "") {
          return;
        }
        const updatedSkills = [...resumeDetails.skills, newSkill];
        setResumeDetails({ ...resumeDetails, skills: updatedSkills });
        setNewSkill("");
      };
    
      const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
      };
    
      const handleUpload = () => {
        if (selectedFile) {
          const formData = new FormData();
          formData.append("resume", selectedFile);
          formData.append("extractionMethod", extractionMethod);
    
          setUploading(true); // Set uploading state to true
    
          axios
            .post("http://localhost:3005/upload", formData, {
              
            })
            .then((response) => {
              console.log("Resume uploaded successfully.");
              
              setResumeDetails(response.data.resumeDetails);
            })
            .catch((error) => {
              console.error("Error uploading resume:", error);
              
            })
            .finally(() => {
              setUploading(false); // Set uploading state to false
            });
        }
      };
    
      const handleSave = () => {
        if (!resumeDetails) {
          setSaveMessage("No resume details to save.");
          return;
        }
    
        axios
          .post("http://localhost:3005/save", resumeDetails)
          .then((response) => {
            toast.success(response.data.message);
          })
          .catch((error) => {
            console.error("Error saving resume details:", error);
            setSaveMessage("An error occurred while saving the resume details.");
          });
      };
    
      const handleNameChange = (event) => {
        setResumeDetails({ ...resumeDetails, name: event.target.value });
      };
    
      const handleEmailChange = (event) => {
        setResumeDetails({ ...resumeDetails, email: event.target.value });
      };
    
      const handleEducationChange = (event) => {
        // const updatedEducation = [...resumeDetails.education];
        // updatedEducation[index][field] = value;
        setResumeDetails({ ...resumeDetails, education: event.target.value });
      };
    
      const handleExperienceChange = (event) => {
        setResumeDetails({ ...resumeDetails, experience: event.target.value });
      };
    
      const handleExtractionMethodChange = (event) => {
        setExtractionMethod(event.target.value);
      };

      return (
        // ----------------------------------------------Upload Details--------------------------------------------->
        <div className="container">
          <h1 className="mt-5 mb-4 header-title">Resume Parser</h1>
    
          <div className="d-flex align-items-center mb-3">
            <div className="me-2">
              <input
                type="file"
                className="form-control"
                onChange={handleFileChange}
              />
            </div>
    
            <div className="me-2">
              <label className="form-label">Parsing Method:</label>
            </div>
    
            <div className="me-2">
              <select
                className="form-select"
                value={extractionMethod}
                onChange={handleExtractionMethodChange}
              >
                <option value="python">NLP</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
    
            <div className="ms-2">
              <button className="btn btn-primary btn-parse" onClick={handleUpload}>
                Parse
              </button>
            </div>
          </div>
    
          {uploading && (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Uploading...</span>
              </div>
              <p>Parsing...</p>
            </div>
          )}
    
          <p>{uploadMessage}</p>
    
          {resumeDetails && (
            <div>
              <h3 className="mt-4 mb-3">Resume Details</h3>
    
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={resumeDetails.name}
                  onChange={handleNameChange}
                />
              </div>
    
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="text"
                  className="form-control"
                  value={resumeDetails.email}
                  onChange={handleEmailChange}
                />
              </div>
    
              <h4 className="mb-3">Education</h4>
              <div className="mb-3">
                <textarea
                  className="form-control"
                  rows="3"
                  value={resumeDetails.education}
                  onChange={handleEducationChange}
                />
              </div>
    
    
              <h4 className="mb-3">Experience</h4>
              <textarea
                className="form-control"
                value={resumeDetails.experience}
                onChange={handleExperienceChange}
              ></textarea>
    
              <h4 className="mb-3">Skills</h4>
              <div className="mb-3">
                {resumeDetails.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="d-inline-flex align-items-center me-2 mb-2"
                  >
                    <span className="badge bg-primary">{skill}</span>
                    <button
                      className="btn btn-link btn-sm text-danger ms-1"
                      onClick={() => handleRemoveSkill(index)}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                ))}
              </div>
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  value={newSkill}
                  onChange={handleNewSkillChange}
                  placeholder="Add a new skill"
                />
                <button className="btn btn-primary btn-add" onClick={handleAddSkill}>
                  Add
                </button>
              </div>
    
              <div className="mb-3">
                <button className="btn btn-primary btn-save" onClick={handleSave}>
                  Save
                </button>
              </div>
              {/* <p>{saveMessage}</p> */}
              <ToastContainer position="top-center" autoClose={500} />
            </div>
          )}
        </div>
        );
        };

export default UploadDetailsPage;
