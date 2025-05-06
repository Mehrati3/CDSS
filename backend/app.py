from flask import Flask, request, jsonify
from flask_cors import CORS
import pdfplumber
import tempfile

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

    return jsonify({
        "table": extracted_table,
        "diagnosis": "🔍 PDF table extracted successfully."
    })

if __name__ == "__main__":
    print("✅ Flask server starting on http://localhost:5000 ...")
    app.run(debug=True)
