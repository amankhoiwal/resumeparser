# Resume Parser

## Description
This project is a web application that allows users to parse resumes with integrated candidate search functionality. 

## Features

* Resume Parser: Users can upload resume pdf and parse them using JavaScript parsing or NLP parsing methods. The parsed data can be edited before saving it to the database.
* Resume Database: Provides a list of all stored resumes in the database. Users can update resume information directly from this app.
* Candidate Search: Enables users to search for candidates based on desired skills.

## UI
![image](https://github.com/Info-Origin/InfoElasticSearch/assets/57308428/1a27ca39-88c2-4a6f-8b79-e815c940869d)


## System Requirements

* Python 3.10.5 and above
* Elasticsearch 8.8.1
* MySQL 8.0

## Getting Started
To run the project locally, follow these steps:
1. Clone the repository to your local machine.
2. Client-side Installation
Install the below frontend dependencies by running the following command:
   ```
   cd client
   npm install axios bootstrap-icon react-toastify 
   ```
3. Server-side Installation
   Install the required backend dependencies by running the following command:
   ```
   cd backend
   npm install express multer pdfjs-dist child_process cors fs @elastic/elasticsearch mysql2
   '```
4. NLP Parsing Installation
   make sure you are in the backend directory
   ```
   pip install spacy
   python -m spacy download en_core_web_sm
   ```

## Basic Steps for Running
### Replace the placeholders for credentials with your credentials (Mysql credentials in server.js and also replace the elasticsearch index in server.js).
1. Start Elasticsearch service and make sure it is running.
2. Start the MySQL service and ensure it is running.
3. Open a terminal or command prompt.
4. Navigate to the backend directory.
5. Run the server-side using the following command:

```
nodemon server.js
```

6. Open another terminal or command prompt.
7. Navigate to the client directory.
8. Run the client-side using the following command:

```
npm start
```

## Architecture

The project follows a client-server architecture. The frontend is built using React, it provides the user interface for uploading resumes, searching candidates, and managing the resume database. It communicates with the backend, which is developed using the Node.js Express framework. The server-side handles resume parsing, database interactions, and integration with Elasticsearch.

The resume parsing functionality includes two methods: JavaScript parsing and NLP parsing. JavaScript parsing utilizes the pdfjs-dist module for extracting text from resume pdf and various functions are defined to extract the relevant information, while NLP parsing uses the spacy english library in Python.

The parsed resume data is stored in a MySQL database and indexed in Elasticsearch for searching. The client-side communicates with the server-side using RESTful APIs.








