

## ✨ Features

- 🤖 **AI-Powered Detection**: Advanced CNN model with 95%+ accuracy
- 📊 **Interactive Charts**: Real-time animated visualization of results
- 🎨 **Modern UI**: Beautiful, responsive interface with smooth animations
- 📱 **Mobile Friendly**: Works seamlessly on all devices
- 🚀 **Fast Analysis**: Get results in seconds
- 📈 **Detailed Statistics**: Comprehensive analytics dashboard
- 💡 **Treatment Recommendations**: Actionable advice for each disease

## 🚀 Installation & Setup

### Prerequisites

- Python 3.8 - 3.10 (TensorFlow 2.7.0 compatibility)
- pip (Python package manager)
- Virtual environment (recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/SAURABHSINGHDHAMI/Plant-Disease-Detection.git
cd Plant-Disease-Detection
```

### Step 2: Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

**Important:** If you encounter NumPy compatibility issues:
```bash
pip uninstall numpy
pip install numpy==1.21.4
```

### Step 4: Create Static Folder

Ensure the `static` folder exists with the required files:
```bash
mkdir static
```
Then add the `index.html`, `style.css`, and `script.js` files to the `static` folder.

### Step 5: Run the Application

```bash
uvicorn app:app --reload
```

The application will be available at: **http://localhost:8000**

## 🔌 API Endpoints

### `GET /`
Returns the main web interface

### `POST /predict`
**Description:** Accepts plant leaf image and returns disease prediction

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: `file` (image file)

**Response:**
```json
{
  "success": true,
  "plant_type": "Tomato",
  "disease": "Bacterial_spot",
  "confidence": 96.5,
  "class": "Tomato-Bacterial_spot",
  "all_probabilities": {
    "Tomato-Bacterial_spot": 96.5,
    "Potato-Early_blight": 2.3,
    "Corn-Common_rust": 1.2
  }
}
```

### `GET /health`
Health check endpoint to verify API status

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

## 🧠 Model Architecture

The CNN model consists of:

1. **Input Layer**: 256x256x3 (RGB images)
2. **Conv2D Layer 1**: 32 filters, 3x3 kernel
3. **MaxPooling Layer 1**: 3x3 pool size
4. **Conv2D Layer 2**: 16 filters, 3x3 kernel
5. **MaxPooling Layer 2**: 2x2 pool size
6. **Flatten Layer**
7. **Dense Layer**: 8 units, ReLU activation
8. **Output Layer**: 3 units, Softmax activation

**Training Details:**
- Optimizer: Adam (learning rate: 0.0001)
- Loss: Categorical Crossentropy
- Epochs: 50
- Batch Size: 128
- Validation Split: 20%

## 🛠️ Technologies Used

### Backend
- **FastAPI**: Modern, fast web framework
- **TensorFlow/Keras**: Deep learning framework
- **OpenCV**: Image processing
- **NumPy**: Numerical computing
- **Uvicorn**: ASGI server

### Frontend
- **HTML5**: Structure
- **CSS3**: Styling with animations
- **JavaScript**: Interactivity
- **Chart.js**: Data visualization
- **Font Awesome**: Icons

## 📊 Performance Metrics

- **Accuracy**: 95.8%
- **Average Response Time**: 1.2 seconds
- **Supported Image Formats**: JPG, JPEG, PNG
- **Max Image Size**: 10MB

