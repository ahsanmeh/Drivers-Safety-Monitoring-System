# 🚨 Frontend Implementation Guide - Incident Q&A System

## 📋 New Feature: Incident Questions & Answers

The backend now supports a **Q&A system** for incidents where:
- **Admin** can add custom questions when creating incidents
- **Driver** can answer those questions for their assigned incidents
- **Admin** can view all questions and answers

---

## 🔧 Backend API Changes

### **New Field Added to Incident Model:**
```javascript
questions: [
  {
    question: String,        // Required, max 500 chars
    answer: String,          // Optional, max 1000 chars
    answeredAt: Date,        // Auto-set when answered
    isRequired: Boolean      // Default: false
  }
]
```

### **New API Endpoint:**
**PUT** `/api/incidents/:id/answer-questions`
- **Access**: Driver (for their incidents only)
- **Purpose**: Answer questions for an incident

---

## 📝 Frontend Implementation Required

### **1. Update Incident Interface/Type**

**Add to your Incident type/interface:**
```typescript
interface Incident {
  // ... existing fields
  questions: {
    question: string;
    answer?: string;
    answeredAt?: string;
    isRequired: boolean;
  }[];
}
```

### **2. Update Incident Creation Form (Admin)**

**Add questions section to incident creation form:**
```jsx
// Add to your incident creation form
const [questions, setQuestions] = useState([]);

// Add question function
const addQuestion = () => {
  setQuestions([...questions, { question: '', isRequired: false }]);
};

// Remove question function
const removeQuestion = (index) => {
  setQuestions(questions.filter((_, i) => i !== index));
};

// Update question function
const updateQuestion = (index, field, value) => {
  const updated = [...questions];
  updated[index][field] = value;
  setQuestions(updated);
};

// In your form JSX:
<div className="questions-section">
  <h3>Questions for Driver</h3>
  {questions.map((q, index) => (
    <div key={index} className="question-item">
      <input
        type="text"
        placeholder="Enter question for driver..."
        value={q.question}
        onChange={(e) => updateQuestion(index, 'question', e.target.value)}
        maxLength={500}
      />
      <label>
        <input
          type="checkbox"
          checked={q.isRequired}
          onChange={(e) => updateQuestion(index, 'isRequired', e.target.checked)}
        />
        Required
      </label>
      <button onClick={() => removeQuestion(index)}>Remove</button>
    </div>
  ))}
  <button onClick={addQuestion}>Add Question</button>
</div>
```

**Include questions in API call:**
```javascript
const createIncident = async (incidentData) => {
  const response = await fetch('/api/incidents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...incidentData,
      questions: questions.filter(q => q.question.trim()) // Only include non-empty questions
    })
  });
};
```

### **3. Update Incident Display (Both Admin & Driver)**

**Show questions and answers in incident details:**
```jsx
// In your incident details component
const IncidentDetails = ({ incident }) => {
  return (
    <div className="incident-details">
      {/* ... existing incident fields */}
      
      {/* Questions & Answers Section */}
      {incident.questions && incident.questions.length > 0 && (
        <div className="qa-section">
          <h3>Questions & Answers</h3>
          {incident.questions.map((qa, index) => (
            <div key={index} className="qa-item">
              <div className="question">
                <strong>Q{index + 1}:</strong> {qa.question}
                {qa.isRequired && <span className="required">*</span>}
              </div>
              <div className="answer">
                {qa.answer ? (
                  <>
                    <strong>Answer:</strong> {qa.answer}
                    <small>Answered: {new Date(qa.answeredAt).toLocaleString()}</small>
                  </>
                ) : (
                  <span className="no-answer">No answer provided</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### **4. Add Answer Questions Component (Driver)**

**Create component for drivers to answer questions:**
```jsx
const AnswerQuestions = ({ incident, onUpdate }) => {
  const [answers, setAnswers] = useState([]);

  // Initialize answers state
  useEffect(() => {
    const initialAnswers = incident.questions.map((qa, index) => ({
      questionIndex: index,
      answer: qa.answer || ''
    }));
    setAnswers(initialAnswers);
  }, [incident.questions]);

  const updateAnswer = (index, answer) => {
    const updated = [...answers];
    updated[index].answer = answer;
    setAnswers(updated);
  };

  const submitAnswers = async () => {
    try {
      // Filter out empty answers for optional questions
      const answersToSubmit = answers.map(({ questionIndex, answer }) => ({
        questionIndex,
        answer: answer || '' // Send empty string for optional questions
      }));

      const response = await fetch(`/api/incidents/${incident._id}/answer-questions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: answersToSubmit })
      });

      if (response.ok) {
        onUpdate(); // Refresh incident data
        alert('Answers submitted successfully!');
      }
    } catch (error) {
      alert('Error submitting answers');
    }
  };

  return (
    <div className="answer-questions">
      <h3>Answer Questions</h3>
      {incident.questions.map((qa, index) => (
        <div key={index} className="question-form">
          <label>
            <strong>Q{index + 1}:</strong> {qa.question}
            {qa.isRequired && <span className="required">*</span>}
          </label>
          <textarea
            value={answers[index]?.answer || ''}
            onChange={(e) => updateAnswer(index, e.target.value)}
            placeholder="Enter your answer..."
            maxLength={1000}
            rows={3}
          />
        </div>
      ))}
      <button onClick={submitAnswers}>Submit Answers</button>
    </div>
  );
};
```

### **5. Update Incident List (Show Q&A Status)**

**Add Q&A status indicator to incident list:**
```jsx
const IncidentListItem = ({ incident }) => {
  const getQAStatus = () => {
    if (!incident.questions || incident.questions.length === 0) {
      return { text: 'No Questions', class: 'no-questions' };
    }
    
    const answeredCount = incident.questions.filter(q => q.answer).length;
    const totalCount = incident.questions.length;
    
    if (answeredCount === totalCount) {
      return { text: 'All Answered', class: 'all-answered' };
    } else if (answeredCount > 0) {
      return { text: `${answeredCount}/${totalCount} Answered`, class: 'partial' };
    } else {
      return { text: 'Pending Answers', class: 'pending' };
    }
  };

  const qaStatus = getQAStatus();

  return (
    <div className="incident-item">
      {/* ... existing incident fields */}
      <div className={`qa-status ${qaStatus.class}`}>
        {qaStatus.text}
      </div>
    </div>
  );
};
```

---

## 🎨 UI/UX Recommendations

### **Admin Interface:**
- ✅ **Add Questions Section** in incident creation form
- ✅ **Show Q&A Status** in incident list (pending/answered)
- ✅ **View All Answers** in incident details
- ✅ **Required Question Indicator** (*) for mandatory questions

### **Driver Interface:**
- ✅ **Answer Questions Button** on incident details page
- ✅ **Question Form** with textarea for each question
- ✅ **Required Field Validation** before submission
- ✅ **Answer Status** showing which questions are answered

### **Visual Indicators:**
```css
.qa-status.pending { color: #f39c12; }      /* Orange for pending */
.qa-status.partial { color: #3498db; }      /* Blue for partial */
.qa-status.all-answered { color: #27ae60; } /* Green for complete */
.qa-status.no-questions { color: #95a5a6; } /* Gray for no questions */
.required { color: #e74c3c; }               /* Red for required */
```

---

## 📋 API Request/Response Examples

### **Create Incident with Questions (Admin):**
```javascript
POST /api/incidents
{
  "driver": "507f1f77bcf86cd799439011",
  "vehicle": "507f1f77bcf86cd799439012",
  "incidentType": "phone_usage",
  "severity": "medium",
  "location": {
    "address": "123 Main St",
    "coordinates": { "latitude": 40.7128, "longitude": -74.0060 }
  },
  "description": "Driver was using phone while driving",
  "questions": [
    {
      "question": "What were you doing when the incident occurred?",
      "isRequired": true
    },
    {
      "question": "Were there any witnesses present?",
      "isRequired": false
    }
  ]
}
```

### **Answer Questions (Driver):**
```javascript
PUT /api/incidents/507f1f77bcf86cd799439013/answer-questions
{
  "answers": [
    {
      "questionIndex": 0,
      "answer": "I was checking my GPS navigation app"
    },
    {
      "questionIndex": 1,
      "answer": "Yes, there was a passenger in the vehicle"
    }
  ]
}
```

**Note:** Answers are optional. You can send empty strings or omit the answer field for optional questions:
```javascript
{
  "answers": [
    {
      "questionIndex": 0,
      "answer": "I was checking my GPS navigation app"
    },
    {
      "questionIndex": 1,
      "answer": ""  // Empty answer for optional question
    }
  ]
}
```

### **Incident Response (with Q&A):**
```javascript
{
  "success": true,
  "data": {
    "incident": {
      "_id": "507f1f77bcf86cd799439013",
      "incidentNumber": "INC000001",
      "incidentType": "phone_usage",
      "severity": "medium",
      "status": "reported",
      "description": "Driver was using phone while driving",
      "questions": [
        {
          "question": "What were you doing when the incident occurred?",
          "answer": "I was checking my GPS navigation app",
          "answeredAt": "2024-01-15T14:30:00.000Z",
          "isRequired": true
        },
        {
          "question": "Were there any witnesses present?",
          "answer": "Yes, there was a passenger in the vehicle",
          "answeredAt": "2024-01-15T14:30:00.000Z",
          "isRequired": false
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

## ✅ Implementation Checklist

- [ ] Update Incident TypeScript interface
- [ ] Add questions section to incident creation form (Admin)
- [ ] Update incident display to show Q&A
- [ ] Create answer questions component (Driver)
- [ ] Add Q&A status indicators to incident list
- [ ] Update API calls to include questions
- [ ] Add validation for required questions
- [ ] Style Q&A components with recommended CSS
- [ ] Test complete Q&A workflow

---

**🎯 This Q&A system enhances incident management by allowing admins to gather specific information from drivers and track their responses!**
