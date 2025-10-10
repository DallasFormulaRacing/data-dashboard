from flask import Flask, jsonify, request

app = Flask(__name__)

from flask_cors import CORS
CORS(app)


if __name__ == '__main__':
    app.run(debug=True, port=5001)

    # DEBUG
