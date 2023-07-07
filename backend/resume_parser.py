import spacy
import sys
import json

def extract_resume_details(resumeText):
    nlp = spacy.load("en_core_web_sm")
    doc = nlp(resumeText)
    
    # Extract name
    name = None
    for entity in doc.ents:
        if entity.label_ == "PERSON":
            name = entity.text
            break
    
    # Extract email
    email = None
    for token in doc:
        if token.like_email:
            email = token.text
            break
    
    # Extract education
    education = []
    for entity in doc.ents:
        if entity.label_ == "EDUCATION":
            education.append(entity.text)
    
    # Extract experience
    experience = None
    for sent in doc.sents:
        if "experience" in sent.text.lower():
            experience = sent.text
            break
    
    # Extract skills
    skills = []
    for chunk in doc.noun_chunks:
        if "skill" in chunk.text.lower():
            skills.append(chunk.text)
    
    return {
        "name": name,
        "email": email,
        "education": education,
        "experience": experience,
        "skills": skills
    }

resumeText = sys.argv[1]
resume_details = extract_resume_details(resumeText)
print(json.dumps(resume_details, ensure_ascii=False))

