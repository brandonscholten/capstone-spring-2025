from flask import Flask, request, jsonify, Response
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
import requests
import bcrypt
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Update the connection string with your actual MySQL credentials and database name
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:0000@localhost:3306/botnbevy_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

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
            "image": game.image,
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

if __name__ == '__main__':
    app.run(debug=True)