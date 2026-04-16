import base64
from io import BytesIO

import numpy as np
from flask import Flask, request, jsonify
from PIL import Image
import face_recognition
from ultralytics import YOLO
import os

app = Flask(__name__)
print(f"🚀 FACE SERVER VERSION: 2026-01-06 13:05", flush=True)
print(f"📁 WORKING DIRECTORY: {os.getcwd()}", flush=True)

# Load YOLO model for mobile detection
def log_debug(msg):
    print(msg, flush=True)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ai_models', 'mobile.pt')
try:
    model = YOLO(MODEL_PATH)
    print(f"✅ YOLO Mobile Detection model loaded from {MODEL_PATH}")
except Exception as e:
    print(f"❌ Error loading YOLO model: {e}")
    model = None


def decode_image(b64_str: str):
    try:
        img_bytes = base64.b64decode(b64_str)
        img = Image.open(BytesIO(img_bytes)).convert("RGB")
        return img # Return PIL object for easier resizing
    except Exception:
        return None

def resize_if_large(img, max_dim=1280):
    width, height = img.size
    if width <= max_dim and height <= max_dim:
        return np.array(img)
    
    if width > height:
        new_width = max_dim
        new_height = int(height * (max_dim / width))
    else:
        new_height = max_dim
        new_width = int(width * (max_dim / height))
        
    print(f"Resizing image from {width}x{height} to {new_width}x{new_height}", flush=True)
    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    return np.array(img)


@app.route("/compare-faces", methods=["POST"])
def compare_faces():
    data = request.get_json(force=True)
    driver_id = data.get("driver_id", "Unknown")
    print(f"--- FACE COMPARISON REQUEST RECEIVED for Driver: {driver_id} ---", flush=True)
    ref_b64 = data.get("reference_image")
    live_b64 = data.get("live_image")

    if not ref_b64 or not live_b64:
        return jsonify({"error": "reference_image and live_image are required"}), 400

    ref_pil = decode_image(ref_b64)
    live_pil = decode_image(live_b64)

    if ref_pil is None or live_pil is None:
        return jsonify({"error": "Invalid image data"}), 400

    ref_img = resize_if_large(ref_pil)
    live_img = resize_if_large(live_pil)

    try:
        ref_encodings = face_recognition.face_encodings(ref_img)
        
        # Reduced upsampling to 1 to prevent memory crashes
        # Finding Live Face Locations (checking rotations)...
        
        live_locs = []
        live_img_to_process = live_img
        
        # Try finding faces in 0, 90, 180, 270 degree rotations
        for angle in [0, 90, 180, 270]:
            if angle > 0:
                # Rotate using PIL then convert back to numpy
                pil_img = Image.fromarray(live_img)
                rotated_pil = pil_img.rotate(-angle, expand=True) # Negative for clockwise
                live_img_check = np.array(rotated_pil)
            else:
                live_img_check = live_img

            live_locs = face_recognition.face_locations(live_img_check, number_of_times_to_upsample=1)
            
            if len(live_locs) > 0:
                live_img_to_process = live_img_check
                break # Stop rotating if we found a face

        # Use the rotated image that actually had the face
        live_encodings = face_recognition.face_encodings(live_img_to_process, known_face_locations=live_locs)
        
    except Exception as e:
        print(f"Error during face processing: {e}")
        return jsonify({"error": f"AI Engine Error: {str(e)}"}), 500

    if len(ref_encodings) == 0:
        return jsonify({"error": "No face found in reference image"}), 400

    if len(live_encodings) == 0:
        return jsonify({"error": "AI could not find your face in the camera photo. Please stay still and ensure good lighting."}), 400

    ref_encoding = ref_encodings[0]
    live_encoding = live_encodings[0]

    try:
        distance = face_recognition.face_distance([ref_encoding], live_encoding)[0]
    except Exception as e:
        print(f"Error during distance calculation: {e}", flush=True)
        return jsonify({"error": "Distance calculation failed"}), 500

    # Standard threshold for face_recognition is 0.6 (lower is better)
    match = bool(distance <= 0.6)
    similarity = float(max(0.0, min(1.0, 1.0 - distance)))
    
    return jsonify({
        "distance": float(distance),
        "match": match,
        "similarity": similarity
    }), 200


@app.route("/detect-face", methods=["POST"])
def detect_face():
    print("--- FACE DETECTION REQUEST RECEIVED ---", flush=True)
    try:
        data = request.get_json(force=True)
        image_b64 = data.get("image")

        if not image_b64:
            return jsonify({"error": "image is required"}), 400

        img_pil = decode_image(image_b64)
        if img_pil is None:
            return jsonify({"error": "Invalid image data"}), 400

        # Convert to numpy and resize if needed
        img = resize_if_large(img_pil)
        
        # Detect faces
        # number_of_times_to_upsample=1 helps find smaller faces
        face_locations = face_recognition.face_locations(img, number_of_times_to_upsample=1)
        face_count = len(face_locations)

        print(f"Debug: Image shape {img.shape}, Faces detected: {face_count}")

        if face_count == 0:
            # Try one more time with higher upsampling if image is small
            if img.shape[0] < 800 or img.shape[1] < 800:
                print("Small image detected, retrying with upsample=2...")
                face_locations = face_recognition.face_locations(img, number_of_times_to_upsample=2)
                face_count = len(face_locations)
                print(f"Debug (Retry): Faces detected: {face_count}")

        if face_count == 0:
            return jsonify({"error": "No face detected. Please ensure your face is clearly visible and well-lit."}), 400
        
        if face_count > 1:
            return jsonify({"error": f"Multiple faces ({face_count}) detected. Please ensure only your face is in the photo."}), 400

        return jsonify({"message": "Face detected successfully", "face_count": face_count}), 200
    except Exception as e:
        print(f"ERROR in detect_face: {e}")
        return jsonify({"error": f"Face recognition error: {str(e)}"}), 500


import dlib
from scipy.spatial import distance as dist
import cv2

# Initialize dlib detectors
SHAPE_PREDICTOR_PATH = os.path.join(os.path.dirname(__file__), 'ai_models', 'shape_predictor_68_face_landmarks.dat')
detector = dlib.get_frontal_face_detector()
try:
    predictor = dlib.shape_predictor(SHAPE_PREDICTOR_PATH)
    print(f"✅ Dlib Face Predictor loaded from {SHAPE_PREDICTOR_PATH}")
except Exception as e:
    print(f"❌ Error loading dlib predictor: {e}")
    predictor = None

# Driver state tracking
# { driver_id: { 'eye_frames': 0, 'yawn_frames': 0, 'nod_frames': 0 } }
driver_states = {}

def get_ear(eye):
    # Compute the euclidean distances between the two sets of
    # vertical eye landmarks (x, y)-coordinates
    A = dist.euclidean(eye[1], eye[5])
    B = dist.euclidean(eye[2], eye[4])
    # Compute the euclidean distance between the horizontal
    # eye landmark (x, y)-coordinates
    C = dist.euclidean(eye[0], eye[3])
    # Compute the eye aspect ratio
    ear = (A + B) / (2.0 * C)
    return ear

def get_mar(mouth):
    # Mouth Aspect Ratio
    A = dist.euclidean(mouth[13], mouth[19]) # 51, 57 index
    B = dist.euclidean(mouth[14], mouth[18]) # 52, 56 index
    C = dist.euclidean(mouth[12], mouth[16]) # 50, 54 index
    mar = (A + B) / (2.0 * C)
    return mar

@app.route("/detect-mobile", methods=["POST"])
def detect_mobile():
    print("--- DETECT REQUEST RECEIVED ---", flush=True)
    data = request.get_json(force=True)
    image_b64 = data.get("image")
    driver_id = data.get("driverId", "unknown")

    if not image_b64:
        return jsonify({"error": "image is required"}), 400

    img = decode_image(image_b64)
    if img is None:
        return jsonify({"error": "Invalid image data"}), 400

    # Convert PIL Image to Numpy Array for OpenCV/Dlib compatibility
    img = np.array(img)

    # Initialize response
    response_data = {
        "detected": False, # Mobile phone flag
        "confidence": 0.0,
        "drowsiness": {
            "is_drowsy": False,
            "is_yawning": False,
            "is_nodding": False,
            "ear": 0.0,
            "mar": 0.0
        }
    }

    # 1. MOBILE PHONE DETECTION (YOLO)
    if model:
        try:
            results = model.predict(img, verbose=False, conf=0.1)
            for result in results:
                for box_data in result.boxes:
                    if int(box_data.cls[0]) == 67: # Cell phone
                        response_data["detected"] = True
                        response_data["confidence"] = float(box_data.conf[0])
                        log_debug(f"MOBILE DETECTED! Conf: {response_data['confidence']}")
                        break
        except Exception as e:
            print(f"YOLO Error: {e}")

    # 2. DROWSINESS DETECTION (DLIB)
    if predictor:
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
            rects = detector(gray, 0)
            
            for rect in rects:
                shape = predictor(gray, rect)
                
                # Convert shape to numpy array
                coords = np.zeros((68, 2), dtype="int")
                for i in range(0, 68):
                    coords[i] = (shape.part(i).x, shape.part(i).y)
                
                # Extract eyes
                left_eye = coords[42:48]
                right_eye = coords[36:42]
                mouth = coords[48:68]
                
                ear = (get_ear(left_eye) + get_ear(right_eye)) / 2.0
                mar = get_mar(mouth)
                
                response_data["drowsiness"]["ear"] = float(ear)
                response_data["drowsiness"]["mar"] = float(mar)
                
                # Thresholds (Tuned for ~1.2s app frequency)
                # Since app is slow, even ONE frame with closed eyes is suspicious
                if ear < 0.22: # Tightly tuned for closure
                    response_data["drowsiness"]["is_drowsy"] = True
                    log_debug(f"DROWSINESS DETECTED! EAR: {ear}")
                
                if mar > 0.5: # Yawning threshold
                    response_data["drowsiness"]["is_yawning"] = True
                    log_debug(f"YAWNING DETECTED! MAR: {mar}")

                # Note: Head nodding usually needs multiple frames or PnP
                # For now, we'll stick to EAR/MAR as they are most reliable in single frames
                break # Only process first face
        except Exception as e:
            print(f"Drowsiness Error: {e}")

    return jsonify(response_data), 200


if __name__ == "__main__":
    # Bind to localhost; adjust host/port if needed
    app.run(host="127.0.0.1", port=8000, debug=False)
