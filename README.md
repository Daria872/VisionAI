# VisionAI

AI-powered multi-class image classification web application that identifies scenes like mountains, glaciers, buildings, forests, seas, and streets using deep learning.

---

## Objective

VisionAI is built to demonstrate how Computer Vision and Deep Learning can classify real-world landscape and urban images into multiple categories.

The project aims to:

- Train a CNN model on a multi-class image dataset
- Perform real-time image prediction
- Provide an interactive and user-friendly interface
- Showcase practical AI integration in web applications

---

## Features

- Multi-class image classification
- Upload and analyze images instantly
- Real-time prediction results
- Clean and responsive UI
- Deep Learning powered prediction engine
- Supports multiple scene categories

---

## Dataset Classes

The model is trained using a dataset containing categories such as:

- Mountain
- Glacier
- Building
- Forest
- Sea
- Street

---

## Tech Stack

### Frontend
- React.js
- HTML
- CSS
- JavaScript

### Backend
- Python
- Flask

### AI / ML
- TensorFlow
- Keras
- OpenCV
- NumPy

### Tools
- Git
- GitHub
- Visual Studio Code

---

## Project Structure

```plaintext
VisionAI/
│
├── backend/
│   ├── model/
│   ├── app.py
│   ├── predict.py
│   ├── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.js
│   │   └── index.js
│
├── dataset/
├── screenshots/
├── README.md
└── .gitignore
```

---

## Setup Instructions

### Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/visionai.git
```

### Navigate to Project Folder

```bash
cd visionai
```

### Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Run the Backend

```bash
python app.py
```

### Run the Frontend

```bash
npm start
```

---

## Future Enhancements

- Live camera detection
- More image categories
- Confidence score visualization
- Mobile responsive optimization
- Cloud deployment

---

## Demo

Add screenshots or demo GIFs inside the screenshots folder.

---

## Author

Developed by Daria using Deep Learning and Computer Vision technologies.
