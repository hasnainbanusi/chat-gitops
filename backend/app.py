import os
from datetime import datetime

import psycopg
from flask import Flask, jsonify, request
from flask_cors import CORS
from psycopg.rows import dict_row


app = Flask(__name__)
CORS(app)


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://chatuser:chatpassword@localhost:5432/chatdb"
)


def get_db_connection():
    return psycopg.connect(
        DATABASE_URL,
        row_factory=dict_row
    )


def init_db():
    conn = get_db_connection()

    with conn.cursor() as cursor:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

    conn.commit()
    conn.close()


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "chat-backend"
    })


@app.route("/api/messages", methods=["GET"])
def get_messages():
    conn = get_db_connection()

    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT id, username, message, created_at
            FROM messages
            ORDER BY created_at ASC
        """)

        messages = cursor.fetchall()

    conn.close()

    for message in messages:
        message["created_at"] = message["created_at"].isoformat()

    return jsonify(messages)


@app.route("/api/messages", methods=["POST"])
def create_message():
    data = request.get_json() or {}

    username = data.get("username", "").strip()
    message = data.get("message", "").strip()

    if not username:
        return jsonify({
            "error": "Username is required"
        }), 400

    if not message:
        return jsonify({
            "error": "Message is required"
        }), 400

    conn = get_db_connection()

    with conn.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO messages (username, message)
            VALUES (%s, %s)
            RETURNING id, username, message, created_at
            """,
            (username, message)
        )

        new_message = cursor.fetchone()

    conn.commit()
    conn.close()

    new_message["created_at"] = (
        new_message["created_at"].isoformat()
    )

    return jsonify(new_message), 201


@app.route("/api/messages/<int:message_id>", methods=["DELETE"])
def delete_message(message_id):
    conn = get_db_connection()

    with conn.cursor() as cursor:
        cursor.execute(
            "DELETE FROM messages WHERE id = %s",
            (message_id,)
        )

        deleted = cursor.rowcount

    conn.commit()
    conn.close()

    if deleted == 0:
        return jsonify({
            "error": "Message not found"
        }), 404

    return jsonify({
        "message": "Message deleted"
    })


@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "application": "Chat App Backend",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat()
    })


if __name__ == "__main__":
    init_db()

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )
