const express = require("express");
const multer = require("multer");
const mysql = require("mysql2");
const cors = require("cors");
const pdfjsLib = require("pdfjs-dist");
const fs = require("fs");
const { spawnSync } = require("child_process");
const { Client } = require("@elastic/elasticsearch");
const https = require("https");
const { URL } = require("url");
const elasticsearch = require("elasticsearch");
const bodyParser = require("body-parser");

const app = express();
const port = 3005;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("uploads"));
app.use(express.static("client/build"));
app.use(express.static("client/public"));
app.use(cors());
app.use(bodyParser.json());

const upload = multer({ dest: "uploads/" });

// MySQL database connection setup
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "360900",
  database: "text",
});

connection.connect((error) => {
  if (error) {
    console.error("Error connecting to MySQL database:", error);
    return;
  }
  console.log("Connected to MySQL database.");
});

function extractResumeDetails(resumeText) {
  const details = {
    name: "",
    email: "",
    education: "",
    experience: "",
    skills: [],
  };

  // Extract name
  const nameRegex = /[A-Za-z]+\s[A-Za-z]+/;
  const nameMatch = resumeText.match(nameRegex);
  if (nameMatch) {
    details.name = nameMatch[0];
  }

  // Extract email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
  const emailMatch = resumeText.match(emailRegex);
  if (emailMatch) {
    details.email = emailMatch[0];
  }

  // Extract education
  const education_keywords = [
    "education",
    "educational background",
    "academic qualifications",
  ];

  const educations = [];

  for (const keyword of education_keywords) {
    const startIndex = resumeText.toLowerCase().indexOf(keyword.toLowerCase());

    if (startIndex !== -1) {
      const endIndex = resumeText.indexOf("\n\n", startIndex);
      const educationText = resumeText
        .slice(startIndex, endIndex !== -1 ? endIndex : undefined)
        .trim();
      educations.push(educationText);
    }
  }

  if (educations.length > 0) {
    details.education = educations;
  }
  

  // Extract experience
  const experience_keywords = [
    "experience",
    "employment history",
    "work experience",
    "professional experience",
    "internships",
    "job history",
    "position of responsibility",
  ];

  const experiences = [];

  for (const keyword of experience_keywords) {
    const startIndex = resumeText.toLowerCase().indexOf(keyword.toLowerCase());

    if (startIndex !== -1) {
      const endIndex = resumeText.indexOf("\n\n", startIndex);
      const experienceText = resumeText
        .slice(startIndex, endIndex !== -1 ? endIndex : undefined)
        .trim();
      experiences.push(experienceText);
    }
  }

  if (experiences.length > 0) {
    details.experience = experiences;
  }
 

  // Extract skills
  const technicalSkillsKeywords = [
    "Python",
    "C++",
    "HTML",
    "CSS",
    "JavaScript",
    "SQL",
    "React",
    "Node.js",
    "Bootstrap",
    "jQuery",
    "NumPy",
    "Pandas",
    "Scikit-Learn",
    "Data Analysis",
    "Web Development",
    "DSA",
    "Data Structures",
    "Algorithms",
    "Problem Solving",
    "Competitive Programming",
    "MS Excel",
    "MS Word",
    "MS PowerPoint",
    "MS Access",
    "MySQL",
    "MongoDB",
    "PostgreSQL",
    "SQLite",
    "Oracle",
    "NoSQL",
    "Linux",
    "Windows",
    "MacOS",
    "Android",
    "iOS",
    "Arduino",
    "Raspberry Pi",
    "Embedded Systems",
    "Solidworks",
    "LT-Spice",
    "ReactJS",
    "MATLAB",
    "Backend",
    "Frontend",
    "Adobe Premiere Pro",
    // Add more keywords here
  ];

  // Extracting skills based on predefined keywords
  const skills = technicalSkillsKeywords.filter((keyword) => {
    const lowercaseKeyword = keyword.toLowerCase();
    return resumeText.toLowerCase().includes(lowercaseKeyword);
  });

  details.skills = skills;

  return details;
}

function extractResumeDetailsFromPythonScript(resumeText) {
  sanitizeText = resumeText.replace(/\u0000/g, ""); // Remove null bytes

  const pythonProcess = spawnSync("python", [
    "./resume_parser.py",
    sanitizeText,
  ]);

  if (pythonProcess.error) {
    console.error(pythonProcess.error);
    res.status(500).json({ error: "Error parsing the resume." });
    return;
  }

  const stdoutData = pythonProcess.stdout.toString();

  const resumeDetails = JSON.parse(stdoutData);

  return resumeDetails;
}

app.post("/upload", upload.single("resume"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "No file uploaded." });
    return;
  }

  const filePath = req.file.path;

  // PDF to text conversion using pdfjslib
  const rawData = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = pdfjsLib.getDocument(rawData);

  loadingTask.promise
    .then((pdfDocument) => {
      const numPages = pdfDocument.numPages;
      const pagesPromises = [];

      for (let i = 1; i <= numPages; i++) {
        pagesPromises.push(
          pdfDocument.getPage(i).then((page) => {
            return page.getTextContent().then((textContent) => {
              return textContent.items.map((item) => item.str).join(" ");
            });
          })
        );
      }

      return Promise.all(pagesPromises);
    })
    .then((pagesText) => {
      const resumeText = pagesText.join("\n");

      const extractionMethod = req.body.extractionMethod;

      let resumeDetails;

      if (extractionMethod === "javascript") {
        // Extract resume details using javascript
        resumeDetails = extractResumeDetails(resumeText);
      } else if (extractionMethod === "python") {
        // Extract resume details using python
        try {
          // Extract resume details using python
          resumeDetails = extractResumeDetailsFromPythonScript(resumeText);
        } catch (error) {
          console.error("An error occurred:", error);
        }
      }

      res
        .status(200)
        .json({ message: "Resume uploaded successfully.", resumeDetails });
    })
    .catch((error) => {
      console.error("Error converting PDF to text:", error);
      res.status(500).json({ message: "Internal server error." });
    });
});

app.post("/save", (req, res) => {
  const resumeDetails = req.body; 

  // Store the resume details in the MySQL database
  const sql =
    "INSERT INTO resdbs (name, email, education, experience, skills) VALUES (?, ?, ?, ?, ?)";
  const values = [
    resumeDetails.name,
    resumeDetails.email,
    JSON.stringify(resumeDetails.education, null, 2),
    resumeDetails.experience,
    resumeDetails.skills.join(","),
  ];

  connection.query(sql, values, (error, results) => {
    if (error) {
      console.error("Error storing resume details in the database:", error);
      res.status(500).json({ message: "Internal server error." });
      return;
    }
    res.status(200).json({ message: "Resume saved successfully." });
  });
});

app.get("/resumedetails", (req, res) => {
  const sql = "SELECT * FROM resdbs";

  connection.query(sql, (error, results) => {
    if (error) {
      console.error(
        "Error retrieving resume details from the database:",
        error
      );
      res.status(500).json({ message: "Internal server error." });
      return;
    }

    const resumeDetails = results.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      education: row.education,
      experience: row.experience,
      skills: row.skills.split(","),
      isupdated: row.isupdated,
    }));

    res.status(200).json({ resumeDetails });
  });
});


//Update and Delete details
app.put("/resumedetails/:id", (req, res) => {
  const id = req.params.id;
  const updatedDetails = req.body;

  connection.query(
    "UPDATE resdbs SET name = ?, email = ?, education = ?, experience = ?, skills = ?, isupdated = ? WHERE id = ?",
    [
      updatedDetails.name,
      updatedDetails.email,
      updatedDetails.education,
      updatedDetails.experience,
      updatedDetails.skills.join(","),
      true,
      id,
    ],
    (error, results) => {
      if (error) {
        console.error("Error updating resume details in the database:", error);
        res.status(500).json({ message: "Internal server error." });
        return;
      }
      res.status(200).json({ message: "Resume updated successfully." });
    }
  );
});

//Delete details
app.delete("/resumedetails/:id", (req, res) => {
  const id = req.params.id;

  connection.query(
    "DELETE FROM resdbs WHERE id = ?",
    [id],
    (error, results) => {
      if (error) {
        console.error("Error deleting resume details in the database:", error);
        res.status(500).json({ message: "Internal server error." });
        return;
      }
      res.status(200).json({ message: "Resume deleted successfully." });
    }
  );
});

//Elastic Search

// Endpoint to sync data from MySQL to Elasticsearch
// MySQL configuration
const mysqlConfig = {
  host: "localhost",
  user: "root",
  password: "360900",
  database: "text",
  table: "resdbs",
};

// Elasticsearch configuration
const esConfig = {
  host: "localhost:9200",
  index: "resumedetails",
};

// Create MySQL connection
const mysqlConnection = mysql.createConnection(mysqlConfig);

// Create Elasticsearch client
const esClient = new elasticsearch.Client({ host: esConfig.host });

// Endpoint to sync MySQL data to Elasticsearch
let lastSyncedId = 0; 

app.get("/sync-data", (req, res) => {
  // Connect to MySQL
  mysqlConnection.connect();

  // Retrieve data from MySQL since the last synchronized ID
  const query = `SELECT * FROM ${mysqlConfig.table} WHERE id > ${lastSyncedId}`;
  mysqlConnection.query(query, (error, results) => {
    if (error) {
      console.error("MySQL query error:", error);
      res.status(500).json({ error: "Failed to retrieve data from MySQL." });
    }

    const data = results;

    if (data.length === 0) {
      // No new data since the last synchronization
      res.json({ message: "No new data to sync." });
      return;
    }

    // Create Elasticsearch index if it doesn't exist
    esClient.indices.exists({ index: esConfig.index }, (error, exists) => {
      if (error) {
        console.error("Elasticsearch index exists check error:", error);
        res.status(500).json({ error: "Failed to check Elasticsearch index." });
      }

      if (!exists) {
        esClient.indices.create(
          { index: esConfig.index },
          (error, response) => {
            if (error) {
              console.error("Elasticsearch index creation error:", error);
              res
                .status(500)
                .json({ error: "Failed to create Elasticsearch index." });
            }

            console.log("Elasticsearch index created.");
            syncDataToElasticsearch(data, res);
          }
        );
      } else {
        syncDataToElasticsearch(data, res);
      }
    });
  });
});

async function isDocumentIdPresent(documentId) {
  try {
    const response = await esClient.get({
      index: esConfig.index,
      id: documentId,
    });
    return response.statusCode === 200;
  } catch (error) {
    if (error.statusCode === 404) {
      return false;
    }
    throw error;
  }
}



async function isDocumentIdPresent(documentId) {
  try {
    const response = await esClient.get({
      index: esConfig.index,
      id: documentId,
    });
    return response.statusCode === 200;
  } catch (error) {
    if (error.statusCode === 404) {
      return false;
    }
    throw error;
  }
} 

async function syncDataToElasticsearch(data, res) {
  const bulkBody = [];
  const documentIds = data.map((row) => row.id);

  // Build bulkBody for updates, deletions, and insertions
  for (const row of data) {
    const documentId = row.id;

    const isDocumentPresent = await isDocumentIdPresent(documentId);

    if (isDocumentPresent) {
      const existingDocument = await esClient.get({
        index: esConfig.index,
        id: documentId,
      });

      if (!isEqual(row, existingDocument.body._source)) {
        bulkBody.push(
          { update: { _index: esConfig.index, _id: documentId } },
          { doc: row }
        );
      }
    } else {
      bulkBody.push(
        { index: { _index: esConfig.index, _id: documentId } },
        row
      );
    }
  }

  // Check for deleted documents and add delete operation to bulkBody
  const mysqlDocumentIds = new Set(documentIds.map((id) => `'${id}'`));
  const updatedMysqlDocumentIds = new Set(
    Array.from(mysqlDocumentIds).map((id) => id.slice(1, -1))
  );

  const esDocumentIds = new Set();

  try {
    const searchResponse = await esClient.search({
      index: esConfig.index,
      body: {
        query: {
          match_all: {}, // Match all documents
        },
        _source: false,
      },
      size: 10000, // Set a higher value to fetch more documents if needed
    });
    // console.log(searchResponse);
    // console.log(searchResponse.hits.hits)

    const hits = searchResponse.hits.hits;
    for (const hit of hits) {
      esDocumentIds.add(hit._id);
    }
  } catch (error) {
    console.error("Elasticsearch search error:", error);
    res.status(500).json({ error: "Failed to sync data to Elasticsearch." });
    return;
  }
  console.log(esDocumentIds);
  console.log(updatedMysqlDocumentIds);

  console.log(updatedMysqlDocumentIds.size)

  const itemToDelete = [];
  for (const esDocumentId of esDocumentIds) {
    if (!updatedMysqlDocumentIds.has(esDocumentId)) {
      itemToDelete.push(esDocumentId);
      console.log(itemToDelete);
    }
  }

  
  for (const documentId of itemToDelete) {
    bulkBody.push({ delete: { _index: esConfig.index, _id: documentId } });
  }

  try {
    const response = await esClient.bulk({ body: bulkBody });

    if (response && response.items) {
      const errorItems = response.items.filter(
        (item) => item.index && item.index.error
      );
      if (errorItems.length > 0) {
        console.error("Elasticsearch bulk indexing errors:", errorItems);
        res
          .status(500)
          .json({ error: "Failed to sync data to Elasticsearch." });
        return;
      }
    }

    const updatedDocumentsCount = response.items.filter(
      (item) => item.update && item.update.result === "updated"
    ).length;

    const insertedDocumentsCount = response.items.filter(
      (item) => item.index && item.index.result === "created"
    ).length;

    const deletedDocumentsCount = response.items.filter(
      (item) => item.delete && item.delete.result === "deleted"
    ).length;

    const totalIndexedDocumentsCount =
      updatedDocumentsCount + insertedDocumentsCount;

    console.log(
      `Indexed ${totalIndexedDocumentsCount} new/updated documents to Elasticsearch.`
    );
    console.log(
      `Deleted ${deletedDocumentsCount} documents from Elasticsearch.`
    );
    res.json({ message: "Data synced to Elasticsearch." });
  } catch (error) {
    console.error("Elasticsearch bulk indexing error:", error);
    res.status(500).json({ error: "Failed to sync data to Elasticsearch." });
  }
}


const PORT = 3005;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`);
});
