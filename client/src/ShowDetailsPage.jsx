import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";
import style from "./App.css";

const ShowDetailsPage = () => {
  const [detailsList, setDetailsList] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [q, setQ] = useState("");
  const [f, setF] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [edited, setEdited] = useState(false);

  const fetchResumeDetails = () => {
    axios
      .get("http://localhost:3005/resumedetails")
      .then((response) => {
        setDetailsList(response.data.resumeDetails);
        console.log(response.data.resumeDetails);
      })
      .catch((error) => {
        console.error("Error retrieving resume details:", error);
        alert("Failed to retrieve resume details.");
      });
  };

  //

  const saveEdit = (id) => {
    setEditingIndex(-1);
    const updatedDetail = detailsList[id];

    // Make PUT request to update the detail on the server
    axios
      .put(
        `http://localhost:3005/resumedetails/${updatedDetail.id}`,
        updatedDetail
      )
      .then((response) => {
        // Check if the update was successful
        if (response.status === 200) {
          setEdited(true);
          console.log("Resume updated successfully.");
          // update the detailsList state with the updated detail
          const updatedList = [...detailsList];
          updatedList[id] = { ...updatedDetail };
          setDetailsList(updatedList);
        } else {
          console.error("Error updating resume.");
        }
      })
      .catch((error) => {
        console.error("Error updating resume:", error);
      });
  };

  const deleteRecord = (id) => {
    

    axios
      .delete(`http://localhost:3005/resumedetails/${id}`)
      .then((response) => {
        alert("Data deleted successfully.");
        console.log("Resume deleted successfully.");
        const updatedList = detailsList.filter((item) => item.id !== id);
        setDetailsList(updatedList);
      })
      .catch((error) => {
        console.error("Error deleting resume:", error);
      });
  };

  const handleDetailFieldChange = (index, field, value) => {
    setDetailsList((prevDetailsList) => {
      const updatedDetailsList = [...prevDetailsList];
      updatedDetailsList[index][field] = value;
      return updatedDetailsList;
    });
  };

  // Calculate start and end indexes based on the current page and records per page
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;

  useEffect(() => {
    // Update total pages whenever the details list or records per page changes
    const newTotalPages = Math.ceil(detailsList.length / recordsPerPage);
    setTotalPages(newTotalPages);
  }, [detailsList, recordsPerPage]);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle records per page change
  const handleRecordsPerPageChange = (event) => {
    const value = parseInt(event.target.value, 10);
    setRecordsPerPage(value);
    setCurrentPage(1); // Reset current page when records per page changes
  };

  const handleShowDetails = () => {
    setShowDetails(true);
    fetchResumeDetails();
  };

  const handleSlide = (index) => {
    setActiveIndex(index);
  };

  const handleSearch = (e) => {
    setQ(e.target.value);
  };

  const handleQuery = async () => {
    const searchTerms = q.split(" ");
    const matchQueries = [];

    let andOperation = false;
    let orQuery = [];

    for (const term of searchTerms) {
      if (term.toLowerCase() === "and") {
        andOperation = true;
        continue;
      }

      if (andOperation) {
        // Perform an "AND" operation on the next term
        const matchQuery = {
          match: {
            skills: {
              query: term,
              operator: "and",
            },
          },
        };
        matchQueries.push(matchQuery);
        andOperation = false;
      } else {
        // Perform an "OR" operation for the current term
        orQuery.push(term);
      }
    }

    if (orQuery.length > 0) {
      const orQueryTerms = orQuery.map((term) => {
        // Create a fuzzy query for each term
        return {
          match: {
            skills: {
              query: term,
              fuzziness: "AUTO",
            },
          },
        };
      });

      // Combine the fuzzy queries using an "OR" operation
      const orQueryObj = {
        bool: {
          should: orQueryTerms,
        },
      };

      matchQueries.push(orQueryObj);
    }

    const query = {
      query: {
        bool: {
          must: matchQueries,
        },
      },
    };

    try {
      const response = await axios.post(
        "http://localhost:9200/resumedetails/_search",
        query
      );

      console.log(response);
      setF(response.data.hits.hits);
      setShowDetails(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSyncData = () => {
    axios
      .get("http://localhost:3005/sync-data")
      .then((response) => {
        console.log(response.data.message);
        alert("Data synced to Elasticsearch.");
      })
      .catch((error) => {
        console.error("Error syncing data to Elasticsearch:", error);
        alert("Failed to sync data to Elasticsearch.");
      });
  };

  return (
    <div className="container">
      <h1 className="mt-5 mb-4 header-title">Saved Details</h1>
      <div className="d-flex align-items-center mb-3">
        <div className="me-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search"
            onChange={handleSearch}
          />
        </div>
        <div className="me-2">
          <button
            className="btn btn-primary me-2 btn-src"
            onClick={handleQuery}
          >
            Search
          </button>
        </div>

        <div className="ms-2">
          <button
            className="btn btn-primary btn-dtls"
            onClick={handleShowDetails}
          >
            Show Saved Data
          </button>
        </div>
        <div className="ms-2">
          <button className="btn btn-primary btn-dtls" onClick={handleSyncData}>
            Sync(ES)
          </button>
        </div>
      </div>

      {showDetails && (
        <div>
          <h1 className="h-saved">Saved Data</h1>
          <select
            id="recordsPerPage"
            value={recordsPerPage}
            onChange={handleRecordsPerPageChange}
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
          </select>
          <ol className="ol-saved-data">
            {detailsList.slice(startIndex, endIndex).map((details, index) => (
              <li key={index}>
                {editingIndex === index ? (
                  <div>
                    {/* Editing form */}
                    <div style={{ display: "flex" }}>
                      <label>Name:</label>
                      <input
                        type="text"
                        value={details.name}
                        onChange={(e) =>
                          handleDetailFieldChange(index, "name", e.target.value)
                        }
                      />
                    </div>
                    <div style={{ display: "flex" }}>
                      <label>Email:</label>
                      <input
                        type="email"
                        value={details.email}
                        onChange={(e) =>
                          handleDetailFieldChange(
                            index,
                            "email",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div style={{ display: "flex" }}>
                      <label>Education:</label>
                      <textarea
                        type="text"
                        value={details.education}
                        onChange={(e) =>
                          handleDetailFieldChange(
                            index,
                            "education",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div style={{ display: "flex" }}>
                      <label>Experience:</label>
                      <textarea
                        type="text"
                        value={details.experience}
                        onChange={(e) =>
                          handleDetailFieldChange(
                            index,
                            "experience",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div style={{ display: "flex" }}>
                      <label>Skills:</label>
                      <textarea
                        type="text"
                        value={details.skills.join(", ")}
                        onChange={(e) =>
                          handleDetailFieldChange(
                            index,
                            "skills",
                            e.target.value.split(", ")
                          )
                        }
                      />
                    </div>
                    <button onClick={() => saveEdit(index)}>Save</button>

                    <button onClick={() => setEditingIndex(-1)}>Cancel</button>
                  </div>
                ) : (
                  <div>
                    {/* Display details */}

                    <div className="updated">
                      <p>Name: {details.name}</p>
                      {details.isupdated === 1 ? (
                        <p className="up-paragraph">Updated</p>
                      ) : (
                        <p className="up-paragraph">Created</p>
                      )}
                      <button
                        className="edit-data-btn"
                        onClick={() => setEditingIndex(index)}
                      >
                        <i class="bi bi-pencil-square"></i>
                      </button>
                      <button
                        type="button"
                        class="delete-btn"
                        onClick={() => deleteRecord(details.id)}
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                    <p>Email: {details.email}</p>
                    <p>Education: {details.education}</p>
                    <p>Experience: {details.experience}</p>
                    <p>Skills: {details.skills.join(", ")}</p>
                  </div>
                )}
              </li>
            ))}
          </ol>
          <nav>
            <ul className="pagination">
              {Array.from({ length: totalPages }, (_, index) => (
                <li
                  key={index}
                  className={`page-item ${
                    currentPage === index + 1 ? "active" : ""
                  }`}
                >
                  <a
                    className="page-link"
                    href="#"
                    onClick={() => handlePageChange(index + 1)}
                  >
                    {index + 1}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {!showDetails && (
        <div>
          {f.length > 0 ? (
            <div>
              <p>Total Results: {f.length}</p>
              <ul className="list-group">
                {f.map((result) => (
                  <li className="list-group-item" key={result._source.id}>
                    <h3>{result._source.name}</h3>
                    <p>
                      <strong>Email:</strong> {result._source.email}
                    </p>
                    <p>
                      <strong>Education:</strong> {result._source.education}
                    </p>
                    <p>
                      <strong>Experience:</strong> {result._source.experience}
                    </p>
                    <p>
                      <strong>Skills:</strong> {result._source.skills}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>No results found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ShowDetailsPage;
