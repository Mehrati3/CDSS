from flask import Flask, request, jsonify
from flask_cors import CORS
import pdfplumber
import tempfile
import pickle
import numpy as np



def load_model():
    """
    Load a pickled model from the specified path.
    """
    model_path = 'model/heart_disease_model.pkl'  # Path to the pickled model
    with open(model_path, 'rb') as file:
        model = pickle.load(file)
    return model
enum = ['No Heart Disease', 'Heart Disease']
def predict(data):

    model_path = 'heart_disease_model.pkl'  # Path to the pickled model
    with open(model_path, 'rb') as file:
        model = pickle.load(file)
    # Make prediction
    confidence = model.predict_proba(data)
    prediction = enum[np.argmax(confidence)]

    # Return response
    return(float(max(max(confidence))),prediction)
 

app = Flask(__name__)
CORS(app)  # Enable CORS for communication with Next.js frontend

@app.route("/extract-table", methods=["POST"])
def extract_table():
    if 'pdf' not in request.files:
        return jsonify({"error": "No PDF uploaded"}), 400

    pdf_file = request.files['pdf']
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp:
        pdf_file.save(temp.name)
        extracted_table = []

        with pdfplumber.open(temp.name) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                if tables:
                    for table in tables:
                        extracted_table.extend(table)
                    break  # Take first table only

        if not extracted_table:
            return jsonify({"error": "No table found in the PDF"}), 400
    numeric_data = []
    for value in extracted_table[1]:
        try:
            numeric_data.append(float(value))
        except (ValueError, TypeError):
            # Handle case where conversion fails (non-numeric values)
            # You could set to 0 or some default value, or skip the column
            numeric_data.append(0.0)
    data = np.array(numeric_data).reshape(1, -1)
    print(data)
    confidence,model_output = predict(data)
    print(model_output)
    return jsonify({
        "table": extracted_table,
        "diagnosis":{"prediction":model_output,
                     "confidence":confidence
                     }
    })

if __name__ == "__main__":
    print("✅ Flask server starting on http://localhost:5000 ...")
    app.run(debug=True)


       