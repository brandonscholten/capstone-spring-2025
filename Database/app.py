#This file will contain a Flask app with API routes for database operations
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'  # Change for MySQL or PostgreSQL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Database Models
class User(db.Model):
    id = db.Column(db.BigInteger, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    last_game = db.Column(db.DateTime, nullable=True)
    email = db.Column(db.String(255), nullable=False)
    discord = db.Column(db.String(255), nullable=False)
    interests = db.Column(db.BigInteger, db.ForeignKey('user_interests.user'), nullable=False)

class Catalogue(db.Model):
    id = db.Column(db.BigInteger, primary_key=True)
    difficulty = db.Column(db.Float, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    number_of_players = db.Column(db.String(255), nullable=False)
    link_to_instructions = db.Column(db.String(255), nullable=False)
    last_time_game_played = db.Column(db.DateTime, nullable=False)

class Event(db.Model):
    id = db.Column(db.BigInteger, db.ForeignKey('users.id'), primary_key=True)
    shop_wide_event = db.Column(db.Boolean, nullable=False)
    game = db.Column(db.BigInteger, db.ForeignKey('catalogue.id'), nullable=True)
    time = db.Column(db.DateTime, nullable=False)
    description = db.Column(db.Text, nullable=False)
    players = db.Column(db.String(255), nullable=False)
    notify_tags = db.Column(db.BigInteger, db.ForeignKey('notifications.id'), nullable=False)

class Notification(db.Model):
    id = db.Column(db.BigInteger, primary_key=True)
    thing_to_notify_about = db.Column(db.String(255), db.ForeignKey('events.notify_tags'), nullable=False)

class UserInterest(db.Model):
    user = db.Column(db.BigInteger, primary_key=True)
    notifications = db.Column(db.BigInteger, db.ForeignKey('notifications.id'), nullable=False)

#Catalouge adds and Deletes
@app.route('/catalouge', methods=['POST'])
def add_game():
    data = request.get_json()
    game = Catalogue(**data)
    db.session.add(game)
    db.session.commit()
    return jsonify({'message': 'Game added successfully!'}), 201

@app.route('/catalouge', methods=['DELETE'])
def delete_game():
    data = request.get_json()
    game = None
    if 'id' in data:
        game = Catalogue.query.get(data['id'])
    elif 'name' in data:
        game = Catalogue.query.filter_by(name=data['name']).first()

    if game:
        db.session.delete(game)
        db.session.commit()
        return jsonify({'message': 'Game deleted successfully!'}), 200
    return jsonify({'error': 'Game not found'}), 404


#User adds and deletes
@app.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    user = User(**data)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User created successfully!', 'id': user.id}), 201


@app.route('/users', methods=['DELETE'])
def delete_user():
    data = request.get_json()
    user = None

    if 'id' in data:
        user = User.query.get(data['id'])
    elif 'email' in data:
        user = User.query.filter_by(email=data['email']).first()

    if user:
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully!'}), 200

    return jsonify({'error': 'User not found'}), 404




@app.route('/events', methods=['POST'])
def add_event():
    data = request.get_json()
    event = Event(**data)
    db.session.add(event)
    db.session.commit()
    return jsonify({'message': 'Event added successfully!', 'id': event.id}), 201




@app.route('/events', methods=['DELETE'])
def delete_event():
    data = request.get_json()
    event = None

    if 'id' in data:
        event = Event.query.get(data['id'])
    
    if event:
        db.session.delete(event)
        db.session.commit()
        return jsonify({'message': 'Event deleted successfully!'}), 200

    return jsonify({'error': 'Event not found'}), 404


@app.route('/events', methods=['GET'])
def get_all_events():
    events = Event.query.all()
    return jsonify([event.__dict__ for event in events if '_sa_instance_state' not in event.__dict__])


@app.route('/events/shop_wide', methods=['GET'])
def get_shop_wide_events():
    events = Event.query.filter_by(shop_wide_event=True).all()
    return jsonify([event.__dict__ for event in events if '_sa_instance_state' not in event.__dict__])


@app.route('/events/not_shop_wide', methods=['GET'])
def get_non_shop_wide_events():
    events = Event.query.filter_by(shop_wide_event=False).all()
    return jsonify([event.__dict__ for event in events if '_sa_instance_state' not in event.__dict__])


@app.route('/events/search', methods=['GET'])
def search_events():
    query_params = request.args
    filters = []

    if 'name' in query_params:
        filters.append(Event.description.ilike(f"%{query_params['name']}%"))
    if 'time' in query_params:
        filters.append(Event.time == query_params['time'])

    query = db.session.query(Event)\
        .join(Catalogue, Event.game == Catalogue.id)\
        .join(Notification, Event.notify_tags == Notification.id)

    if 'game' in query_params:
        query = query.filter(Catalogue.name.ilike(f"%{query_params['game']}%"))
    if 'tags' in query_params:
        query = query.filter(Notification.thing_to_notify_about.ilike(f"%{query_params['tags']}%"))

    events = query.filter(*filters).all()
    
    return jsonify([event.__dict__ for event in events if '_sa_instance_state' not in event.__dict__])



if __name__ == '__main__':
    app.run(debug=True)
