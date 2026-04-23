from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle

app = Flask(__name__)
CORS(app)

with open("../ml/model.pkl", "rb") as f:
    model, vectorizer = pickle.load(f)

@app.route("/predict", methods=["POST"])
def predict():
    text = request.json["text"]
    X = vectorizer.transform([text])
    prediction = model.predict(X)[0]
    return jsonify({"label": prediction})

if __name__ == "__main__":
    app.run(debug=True)