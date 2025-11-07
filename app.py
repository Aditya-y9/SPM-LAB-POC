from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
from keras.models import load_model
import tensorflow as tf
from pathlib import Path

app = FastAPI(title="Plant Disease Detection API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model
model = load_model('plant_disease_model.h5')
CLASS_NAMES = ('Tomato-Bacterial_spot', 'Potato-Early_blight', 'Corn-Common_rust')

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    html_path = Path("static/index.html")
    return html_path.read_text()

@app.post("/predict")
async def predict_disease(file: UploadFile = File(...)):
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        opencv_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if opencv_image is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Preprocess image
        original_shape = opencv_image.shape
        opencv_image = cv2.resize(opencv_image, (256, 256))
        opencv_image = opencv_image.astype(np.float16) / 225.0
        opencv_image = opencv_image.reshape(1, 256, 256, 3)
        
        # Make prediction
        prediction = model.predict(opencv_image)
        predicted_class_idx = np.argmax(prediction)
        predicted_class = CLASS_NAMES[predicted_class_idx]
        confidence = float(prediction[0][predicted_class_idx]) * 100
        
        # Parse result
        plant_type = predicted_class.split('-')[0]
        disease = predicted_class.split('-')[1]
        
        return JSONResponse({
            "success": True,
            "plant_type": plant_type,
            "disease": disease,
            "confidence": round(confidence, 2),
            "class": predicted_class,
            "all_probabilities": {
                CLASS_NAMES[i]: round(float(prediction[0][i]) * 100, 2) 
                for i in range(len(CLASS_NAMES))
            }
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}
