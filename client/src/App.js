import React, { useState,useEffect } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import style from "./App.css";
import ShowDetailsPage from './ShowDetailsPage';
import UploadDetailsPage from './UploadDetailsPage';


const App = () => {
  const [currentPage, setCurrentPage] = useState('upload');

  const handleNext = () => {
    setCurrentPage('show');
  };

  const handlePrev = () => {
    setCurrentPage('upload');
  };

  return (

    <div>
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <a className="navbar-brand" href="#">JobHunt</a>
      <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav mr-auto nav-item">
          <li className={`nav-item ${currentPage === 'upload' ? 'active' : ''}`}>
            <a className="nav-link" href="#" onClick={() => setCurrentPage('upload')}>Upload</a>
          </li>
          <li className={`nav-item ${currentPage === 'show' ? 'active' : ''}`}>
            <a className="nav-link" href="#" onClick={() => setCurrentPage('show')}>Search</a>
          </li>
        </ul>
      </div>
    </nav>

    {currentPage === 'upload' && (
      <>
        <UploadDetailsPage />
      </>
    )}

    {currentPage === 'show' && (
      <>
        <ShowDetailsPage />
      </>
    )}
  </div>
);
};

export default App;
