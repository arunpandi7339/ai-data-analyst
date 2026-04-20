from flask import Flask, request, render_template, jsonify
import pandas as pd
import os

app = Flask(__name__)

app.config['UPLOAD_FOLDER'] = 'uploads'

if not os.path.exists('uploads'):
    os.makedirs('uploads')


def read_csv_file(filepath):
    return pd.read_csv(filepath, sep=r'\s+', skipinitialspace=True)


# ---------------- HOME ----------------
@app.route('/')
def home():
    return render_template('index.html')


# ---------------- UPLOAD ----------------
@app.route("/upload", methods=["POST"])
def upload():
    file = request.files.get('file')

    if file and file.filename != "":
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)

        df = read_csv_file(filepath)
        df.columns = df.columns.str.strip().str.lower()

        return df.head().to_html()

    return "No file uploaded ❌"


# ---------------- ASK AI ----------------
@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    question = data.get("question", "").lower()

    files = os.listdir("uploads")
    if not files:
        return jsonify({"answer": "No file uploaded ❌"})

    latest_file = max(files, key=lambda x: os.path.getctime(os.path.join("uploads", x)))
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], latest_file)

    df = read_csv_file(filepath)
    df.columns = df.columns.str.strip().str.lower()

    if "sales" not in df.columns or "product" not in df.columns:
        return jsonify({"answer": "Invalid CSV format ❌"})

    if "total" in question:
        return jsonify({"answer": f"Total sales: {int(df['sales'].sum())}"})

    elif "top" in question:
        top = df.groupby("product")["sales"].sum().idxmax()
        return jsonify({"answer": f"Top product: {top}"})

    return jsonify({"answer": "Ask: total / top sales"})


# ---------------- PRODUCT CHART ----------------
@app.route("/chart", methods=["GET"])
def chart():
    files = os.listdir("uploads")
    if not files:
        return jsonify({"error": "No file"})

    latest_file = max(files, key=lambda x: os.path.getctime(os.path.join("uploads", x)))
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], latest_file)

    df = read_csv_file(filepath)
    df.columns = df.columns.str.strip().str.lower()

    grouped = df.groupby("product")["sales"].sum()

    return jsonify({
        "labels": list(grouped.index),
        "values": [int(x) for x in grouped.values]
    })


# ---------------- MONTHLY CHART ----------------
@app.route("/monthly", methods=["GET"])
def monthly():
    files = os.listdir("uploads")
    if not files:
        return jsonify({"error": "No file"})

    latest_file = max(files, key=lambda x: os.path.getctime(os.path.join("uploads", x)))
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], latest_file)

    df = read_csv_file(filepath)
    df.columns = df.columns.str.strip().str.lower()

    monthly = df.groupby("month")["sales"].sum()

    return jsonify({
        "months": list(monthly.index),
        "sales": [int(x) for x in monthly.values]
    })


if __name__ == "__main__":
    app.run(debug=True)