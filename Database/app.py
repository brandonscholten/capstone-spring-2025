from flask import Flask, request, jsonify, Response
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
import requests
import bcrypt
from datetime import datetime, timedelta
import redis
import json
from dotenv import load_dotenv
from google.oauth2 import service_account
from googleapiclient.discovery import build
from datetime import datetime
import pytz
import os


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

r = redis.Redis(host='localhost', port=6379, db=0)
load_dotenv()
# Update the connection string with your actual MySQL credentials and database name
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:BOTNBEVY@localhost:3306/botnbevy_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

SERVICE_ACCOUNT_FILE = os.getenv('GOOGLE_SERVICE_ACCOUNT_FILE')
SCOPES = ['https://www.googleapis.com/auth/calendar']
CALENDAR_ID = os.getenv('CALENDAR_ID')
credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)
service = build('calendar', 'v3', credentials=credentials)

db = SQLAlchemy(app)
migrate = Migrate(app, db)

#############################################
#               MODELS                      #
#############################################

# Users and Notification Topics (for subscription, if needed)
user_notification_subscription = db.Table(
    'user_notification_subscription',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('topic_id', db.Integer, db.ForeignKey('notification_topics.id'), primary_key=True)
)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    discord = db.Column(db.String(255), nullable=True)
    subscriptions = db.relationship('NotificationTopic', secondary=user_notification_subscription, back_populates="subscribers")

class NotificationTopic(db.Model):
    __tablename__ = 'notification_topics'
    id = db.Column(db.Integer, primary_key=True)
    topic = db.Column(db.String(255), unique=True, nullable=False)
    subscribers = db.relationship('User', secondary=user_notification_subscription, back_populates="subscriptions")

# Catalogue model for board games
class Catalogue(db.Model):
    __tablename__ = 'catalogue'
    id = db.Column(db.Integer, primary_key=True)  # using Integer as in the table definition
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    publisher = db.Column(db.String(255), nullable=True)
    image = db.Column(db.String(1000), nullable=True)
    difficulty = db.Column(db.Float, nullable=False)
    players = db.Column(db.String(255), nullable=True)
    duration = db.Column(db.String(255), nullable=True)
    yearpublished = db.Column(db.Integer, nullable=True)
    agerange = db.Column(db.String(255), nullable=True)

# Event model
class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    image = db.Column(db.String(255), nullable=True)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    price = db.Column(db.String(50), nullable=True)
    recurring = db.Column(db.Boolean, nullable=False)
    # Link to a catalogue game (board game)
    game_id = db.Column(db.Integer, db.ForeignKey('catalogue.id'), nullable=True)
    game = db.relationship('Catalogue', backref=db.backref('events', lazy=True))
    # Participants stored as a comma-separated list
    participants = db.Column(db.Text, nullable=True)

# Game model for game events (for the "games" tab)
class Game(db.Model):
    __tablename__ = 'games'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    organizer = db.Column(db.String(255), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    description = db.Column(db.Text, nullable=False)
    image = db.Column(db.String(255), nullable=True)
    players = db.Column(db.String(50), nullable=False)  # e.g., "2-4"
    participants = db.Column(db.Text, nullable=True)  # comma-separated list
    password = db.Column(db.String(255), nullable=True)
    # Link to a catalogue game (optional)
    catalogue_id = db.Column(db.Integer, db.ForeignKey('catalogue.id'), nullable=True)
    catalogue = db.relationship('Catalogue', backref=db.backref('games', lazy=True))

#############################################
#              ROUTES                     #
#############################################

# ----- Catalogue Endpoints -----
@app.route('/catalogue', methods=['GET'])
def get_catalogue():
    games = Catalogue.query.all()
    result = []
    for game in games:
        result.append({
            "id": game.id,
            "title": game.title,
            "description": game.description,
            "publisher": game.publisher,
            "image": game.image,
            "difficulty": game.difficulty,
            "players": game.players,
            "duration": game.duration,
            "yearpublished": game.yearpublished,
            "agerange": game.agerange,
        })
    return jsonify(result)

@app.route('/catalogue', methods=['POST'])
def add_catalogue_game():
    data = request.get_json()
    new_game = Catalogue(**data)
    db.session.add(new_game)
    db.session.commit()
    return jsonify({"message": "Catalogue game added", "id": new_game.id}), 201

@app.route('/catalogue', methods=['DELETE'])
def delete_catalogue_game():
    data = request.get_json()
    game = None
    if "id" in data:
        game = Catalogue.query.get(data["id"])
    elif "name" in data:
        game = Catalogue.query.filter_by(name=data["name"]).first()
    if game:
        db.session.delete(game)
        db.session.commit()
        return jsonify({"message": "Catalogue game deleted"}), 200
    return jsonify({"error": "Catalogue game not found"}), 404

@app.route('/catalogue/titles', methods=['GET'])
def get_catalogue_titles():
    games = Catalogue.query.with_entities(Catalogue.id, Catalogue.title).all()
    result = [{"id": game.id, "title": game.title} for game in games]
    return jsonify(result)

# ----- User Endpoints -----
@app.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    user = User(**data)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User created", "id": user.id}), 201

@app.route('/users', methods=['DELETE'])
def delete_user():
    data = request.get_json()
    user = None
    if "id" in data:
        user = User.query.get(data["id"])
    elif "email" in data:
        user = User.query.filter_by(email=data["email"]).first()
    if user:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "User deleted"}), 200
    return jsonify({"error": "User not found"}), 404

# ----- Event Endpoints -----
@app.route('/events', methods=['GET'])
def get_events():
    events = Event.query.all()
    result = []
    for event in events:
        result.append({
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "image": event.image,
            "startTime": event.start_time.isoformat(),
            "endTime": event.end_time.isoformat(),
            "price": event.price,
            "game": event.game_id,
            "participants": event.participants,
        })
    return jsonify(result)

@app.route('/events', methods=['POST'])
def create_event():
    data = request.get_json()
    new_event = Event(
        title=data.get("title"),
        description=data.get("description"),
        image=data.get("image"),
        start_time=datetime.fromisoformat(data.get("startTime")),
        end_time=datetime.fromisoformat(data.get("endTime")),
        price=data.get("price"),
        game_id=data.get("game"),
        participants=data.get("participants"),
        recurring=data.get("recurring", False)
    )
    db.session.add(new_event)
    db.session.commit()
    
    announce_event(new_event)
    return jsonify({"message": "Event created", "id": new_event.id}), 201

@app.route('/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    data = request.get_json()
    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    # Update fields if provided in the request
    event.title = data.get("title", event.title)
    event.description = data.get("description", event.description)
    event.image = data.get("image", event.image)
    event.start_time = datetime.fromisoformat(data.get("startTime")) if "startTime" in data else event.start_time
    event.end_time = datetime.fromisoformat(data.get("endTime")) if "endTime" in data else event.end_time
    event.price = data.get("price", event.price)
    event.game_id = data.get("game", event.game_id)
    event.participants = data.get("participants", event.participants)
    event.recurring = data.get("recurring", event.recurring)

    db.session.commit()
    return jsonify({"message": "Event updated successfully", "id": event.id}), 200

@app.route('/events', methods=['DELETE'])
def delete_event():
    data = request.get_json()
    event = Event.query.get(data.get("id"))
    if event:
        db.session.delete(event)
        db.session.commit()
        return jsonify({"message": "Event deleted"}), 200
    return jsonify({"error": "Event not found"}), 404

# ----- Game Endpoints -----
@app.route('/games', methods=['GET'])
def get_games():
    games = Game.query.all()
    result = []
    for game in games:
        title = game.title
        if not title and game.catalogue_id:
            catalogue_game = Catalogue.query.get(game.catalogue_id)
            title = catalogue_game.title if catalogue_game else None
        result.append({
            "id": game.id,
            "title": title,
            "organizer": game.organizer,
            "startTime": game.start_time.isoformat(),
            "endTime": game.end_time.isoformat(),
            "description": game.description,
            "players": game.players,
            "participants": game.participants,
            "catalogue": game.catalogue_id,
        })
    return jsonify(result)

@app.route('/games', methods=['POST'])
def create_game():
    data = request.get_json()
    
    hashed_password = bcrypt.hashpw(data.get("password").encode('utf-8'), bcrypt.gensalt()).decode('utf-8') if data.get("password") else None
    
    new_game = Game(
        title=data.get("title"),
        organizer=data.get("organizer"),
        start_time=datetime.fromisoformat(data.get("startTime")),
        end_time=datetime.fromisoformat(data.get("endTime")),
        description=data.get("description"),
        image=data.get("image"),
        players=data.get("players"),
        password=hashed_password,
        participants=data.get("participants"),
        catalogue_id=data.get("catalogue")
    )
    db.session.add(new_game)
    db.session.commit()
    announce_game(new_game)
    return jsonify({"message": "Game created", "id": new_game.id}), 201

@app.route('/games', methods=['DELETE'])
def delete_game_entry():
    data = request.get_json()
    game = Game.query.get(data.get("id"))
    if game:
        db.session.delete(game)
        db.session.commit()
        return jsonify({"message": "Game deleted"}), 200
    return jsonify({"error": "Game not found"}), 404

@app.route('/games/<int:game_id>', methods=['PUT'])
def update_game(game_id):
    data = request.get_json()
    game = Game.query.get(game_id)
    if not game:
        return jsonify({"error": "Game not found"}), 404

    # Hash the password only if a new one is provided
    raw_password = data.get("password")
    hashed_password = bcrypt.hashpw(raw_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8') if raw_password else game.password

    # Update only the fields that are provided
    game.title = data.get("title", game.title)
    game.organizer = data.get("organizer", game.organizer)
    game.start_time = datetime.fromisoformat(data.get("startTime")) if "startTime" in data else game.start_time
    game.end_time = datetime.fromisoformat(data.get("endTime")) if "endTime" in data else game.end_time
    game.description = data.get("description", game.description)
    game.image = data.get("image", game.image)
    game.players = data.get("players", game.players)
    game.password = hashed_password  # Store the updated hashed password if provided
    game.participants = data.get("participants", game.participants)
    game.catalogue_id = data.get("catalogue", game.catalogue_id)

    try:
        db.session.commit()
        return jsonify({"message": "Game updated successfully", "id": game.id}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Database error", "details": str(e)}), 500

@app.route('/games/verify-password', methods=['POST'])
def verify_game_password():
    data = request.get_json()
    game_id = data.get("gameId")
    provided_password = data.get("password")
    print(provided_password)
    # Fetch game by ID
    game = Game.query.get(game_id)
    if not game or not game.password:
        return jsonify({"error": "Game not found or no password set"}), 404

    # Verify the password
    if bcrypt.checkpw(provided_password.encode('utf-8'), game.password.encode('utf-8')):
        return jsonify({"isValid": True}), 200
    else:
        return jsonify({"isValid": False}), 401



@app.route('/participants/add', methods=['POST'])
def add_participant():
    data = request.get_json()
    model_type = data.get("type")
    participant = data.get("participant")
    obj_id = data.get("id")
    
    print(model_type,participant,obj_id)
    if not model_type or model_type not in ['event', 'game']:
        return jsonify({"error": "Invalid type. Must be 'event' or 'game'."}), 400
    if not participant:
        return jsonify({"error": "Missing participant."}), 400
    if not obj_id:
        return jsonify({"error": "Missing id."}), 400

    # Determine which model to update
    if model_type == 'event':
        obj = Event.query.get(obj_id)
        if not obj:
            return jsonify({"error": "Event not found"}), 404
    else:  # model_type == 'game'
        obj = Game.query.get(obj_id)
        if not obj:
            return jsonify({"error": "Game not found"}), 404

    # Append the new participant to the existing list
    if obj.participants:
        obj.participants = obj.participants + ", " + participant
    else:
        obj.participants = participant

    db.session.commit()
    return jsonify({"message": "Participant added", "id": obj_id}), 200


# ----- BGG API Proxy Endpoints -----
@app.route('/bgg/search', methods=['GET'])
def bgg_search():
    search_query = request.args.get('search', '')
    exact = request.args.get('exact', '')
    if not search_query:
        return jsonify({"error": "Missing search parameter"}), 400
    url = f"https://boardgamegeek.com/xmlapi/search?search={requests.utils.quote(search_query)}"
    if exact:
        url += f"&exact={exact}"
    try:
        r = requests.get(url)
        return Response(r.content, mimetype="application/xml")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/bgg/boardgame/<game_id>', methods=['GET'])
def bgg_boardgame(game_id):
    params = {}
    if "stats" in request.args:
        params["stats"] = request.args.get("stats")
    url = f"https://boardgamegeek.com/xmlapi/boardgame/{game_id}"
    if params:
        query_str = "&".join([f"{k}={v}" for k, v in params.items()])
        url = f"{url}?{query_str}"
    try:
        r = requests.get(url)
        return Response(r.content, mimetype="application/xml")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#############################################
#         CLEANUP ENDPOINT                #
#############################################
@app.route('/cleanup', methods=['POST'])
def cleanup():
    now = datetime.utcnow()
    
    # Process Events.
    events = Event.query.all()
    for event in events:
        if event.end_time < now:
            if event.recurring:
                # If event is recurring, update start and end times until they are in the future.
                while event.end_time < now:
                    event.start_time += timedelta(weeks=1)
                    event.end_time += timedelta(weeks=1)
            else:
                db.session.delete(event)
    
    # Process Games (non-recurring; simply delete if past end_time).
    games = Game.query.all()
    for game in games:
        if game.end_time < now:
            db.session.delete(game)
    
    db.session.commit()
    return jsonify({"message": "Cleanup completed"}), 200


def announce_event(event):
    # Convert event details to a JSON message
    message = json.dumps({
        'title': event.title,
        'description': event.description,
        'start_time': event.start_time.isoformat(),
        'end_time': event.end_time.isoformat(),
        'price': event.price,
        'game': event.game.title if event.game else None,
        'participants': event.participants
    })
    # Publish to the 'new_event' channel
    r.publish('new_event', message)
    
def announce_game(game):
    """
    Publish game details to Redis so that the Discord bot can announce it.
    """
    message = json.dumps({
        'id': game.id,
        'title': game.title,
        'organizer': game.organizer,
        'start_time': game.start_time.isoformat(),
        'end_time': game.end_time.isoformat(),
        'description': game.description,
        'players': game.players,
        'participants': game.participants,
        'catalogue': game.catalogue_id,
    })
    # Publish the message to the "new_game" channel
    r.publish('new_game', message)
    
    
    
def check_event_conflict(start_iso, end_iso):
    """
    Check for existing events in the calendar that fall within the given time range.
    Both start_iso and end_iso should be in ISO format with timezone info.
    """
    events_result = service.events().list(
        calendarId=CALENDAR_ID,
        timeMin=start_iso,
        timeMax=end_iso,
        singleEvents=True,
        orderBy='startTime'
    ).execute()
    events = events_result.get('items', [])
    return len(events) > 0

@app.route('/create-event', methods=['POST'])
def create_calendar_event():
    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')
    start_time = data.get('startTime')  # e.g., "2025-03-20T16:00:00Z"
    end_time = data.get('endTime')      # e.g., "2025-03-20T20:00:00Z"

    if not (title and start_time and end_time):
        return jsonify({'error': 'Missing required fields: title, startTime, and endTime.'}), 400

    # Check for overlapping events. If any event is found, return an error.
    if check_event_conflict(start_time, end_time):
        return jsonify({
            'error': 'Time slot conflict: There is already an event scheduled during this time.'
        }), 409

    # Build the event payload for Google Calendar.
    event_body = {
        'summary': title,
        'description': description,
        'start': {
            'dateTime': start_time,
            'timeZone': 'UTC'  # Adjust if necessary.
        },
        'end': {
            'dateTime': end_time,
            'timeZone': 'UTC'  # Adjust if necessary.
        }
    }

    try:
        created_event = service.events().insert(
            calendarId=CALENDAR_ID,
            body=event_body
        ).execute()
        return jsonify({
            'message': 'Event created successfully',
            'event': created_event
        }), 201
    except Exception as e:
        return jsonify({'error': f'Failed to create event: {str(e)}'}), 500


def upload_image_to_wix(image_data):
    # If your incoming image data is base64 encoded, decode it:
    # image_bytes = base64.b64decode(image_data)
    # Otherwise, if it's already in binary form, you can use it directly.
    image_bytes = image_data  # adjust this as needed
    # Replace with the actual WIX API endpoint URL
    wix_url = "https://api.wix.com/upload"  # Placeholder URL
    headers = {
        "Authorization": "Bearer YOUR_WIX_API_TOKEN"  # Replace with your actual API token
    }
    # Create a files dict. Adjust the tuple (filename, file content, mime type) as needed.
    files = {
        "file": ("image.png", image_bytes, "image/png")
    }
    response = requests.post(wix_url, headers=headers, files=files)
    response.raise_for_status()  # Raise an error if the upload failed
    # Assuming WIX returns a JSON with the uploaded image URL in a key like "url"
    uploaded_url = response.json().get("url")
    if not uploaded_url:
        raise Exception("Upload failed: No URL returned from WIX")
    return uploaded_url
if __name__ == '__main__':
    app.run(debug=True)