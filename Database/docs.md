Here's a structured API documentation for your Flask application:  

---

# **Board Game API Documentation**

### **Base URL**  
```
http://localhost:5000
```

### **Authentication**  
No authentication is required for these endpoints.  

---

## **Catalogue Endpoints**  
Endpoints to manage board game catalogue entries.

### **1. Get All Games**  
**GET** `/catalogue`  
**Description**: Fetch all board games from the catalogue.  
**Response**:
```json
[
    {
        "id": 1,
        "title": "Catan",
        "description": "A strategy board game...",
        "publisher": "Kosmos",
        "image": "https://example.com/image.jpg",
        "difficulty": 2.5,
        "players": "3-4",
        "duration": "60-90",
        "yearpublished": 1995,
        "agerange": "10+"
    }
]
```

### **2. Add a Game to Catalogue**  
**POST** `/catalogue`  
**Description**: Add a new game to the catalogue.  
**Request Body**:
```json
{
    "title": "Catan",
    "description": "A strategy board game...",
    "publisher": "Kosmos",
    "image": "https://example.com/image.jpg",
    "difficulty": 2.5,
    "players": "3-4",
    "duration": "60-90",
    "yearpublished": 1995,
    "agerange": "10+"
}
```
**Response**:
```json
{"message": "Catalogue game added", "id": 1}
```

### **3. Delete a Game from Catalogue**  
**DELETE** `/catalogue`  
**Request Body**:
```json
{"id": 1}
```
or
```json
{"name": "Catan"}
```
**Response**:
```json
{"message": "Catalogue game deleted"}
```

### **4. Get Catalogue Titles**  
**GET** `/catalogue/titles`  
**Response**:
```json
[
    {"id": 1, "title": "Catan"},
    {"id": 2, "title": "Monopoly"}
]
```

---

## **User Endpoints**  
Endpoints to manage users.

### **1. Create a User**  
**POST** `/users`  
**Request Body**:
```json
{
    "email": "user@example.com",
    "discord": "User#1234"
}
```
**Response**:
```json
{"message": "User created", "id": 1}
```

### **2. Delete a User**  
**DELETE** `/users`  
**Request Body**:
```json
{"id": 1}
```
or
```json
{"email": "user@example.com"}
```
**Response**:
```json
{"message": "User deleted"}
```

---

## **Event Endpoints**  
Endpoints to manage events.

### **1. Get All Events**  
**GET** `/events`  
**Response**:
```json
[
    {
        "id": 1,
        "title": "Game Night",
        "description": "Board game meetup...",
        "image": "https://example.com/event.jpg",
        "startTime": "2025-03-05T18:00:00",
        "endTime": "2025-03-05T21:00:00",
        "price": "Free",
        "game": 1,
        "participants": "User1,User2"
    }
]
```

### **2. Create an Event**  
**POST** `/events`  
**Request Body**:
```json
{
    "title": "Game Night",
    "description": "Board game meetup...",
    "image": "https://example.com/event.jpg",
    "startTime": "2025-03-05T18:00:00",
    "endTime": "2025-03-05T21:00:00",
    "price": "Free",
    "game": 1,
    "participants": "User1,User2"
}
```
**Response**:
```json
{"message": "Event created", "id": 1}
```

### **3. Update an Event**  
**PUT** `/events/{event_id}`  
**Request Body**:
```json
{
    "title": "Updated Game Night",
    "startTime": "2025-03-06T18:00:00"
}
```
**Response**:
```json
{"message": "Event updated successfully", "id": 1}
```

### **4. Delete an Event**  
**DELETE** `/events`  
**Request Body**:
```json
{"id": 1}
```
**Response**:
```json
{"message": "Event deleted"}
```

---

## **Game Endpoints**  
Endpoints to manage games.

### **1. Get All Games**  
**GET** `/games`  
**Response**:
```json
[
    {
        "id": 1,
        "title": "Catan Tournament",
        "organizer": "John",
        "startTime": "2025-03-10T15:00:00",
        "endTime": "2025-03-10T18:00:00",
        "description": "Competitive game event...",
        "image": "https://example.com/game.jpg",
        "players": "4",
        "participants": "User1,User2",
        "catalogue": 1
    }
]
```

### **2. Create a Game**  
**POST** `/games`  
**Request Body**:
```json
{
    "title": "Catan Tournament",
    "organizer": "John",
    "startTime": "2025-03-10T15:00:00",
    "endTime": "2025-03-10T18:00:00",
    "description": "Competitive game event...",
    "image": "https://example.com/game.jpg",
    "players": "4",
    "password": "secret",
    "participants": "User1,User2",
    "catalogue": 1
}
```
**Response**:
```json
{"message": "Game created", "id": 1}
```

### **3. Update a Game**  
**PUT** `/games/{game_id}`  
**Request Body**:
```json
{
    "title": "Updated Catan Tournament",
    "startTime": "2025-03-11T16:00:00"
}
```
**Response**:
```json
{"message": "Game updated successfully", "id": 1}
```

### **4. Delete a Game**  
**DELETE** `/games`  
**Request Body**:
```json
{"id": 1}
```
**Response**:
```json
{"message": "Game deleted"}
```

### **5. Verify Game Password**  
**POST** `/games/verify-password`  
**Request Body**:
```json
{
    "gameId": 1,
    "password": "secret"
}
```
**Response**:
```json
{"isValid": true}
```

---

## **BoardGameGeek API Proxy**  
Fetch data from BoardGameGeek.

### **1. Search Board Games**  
**GET** `/bgg/search?search=catan`  
**Response**:  
XML response from BoardGameGeek API.

### **2. Get Board Game Details**  
**GET** `/bgg/boardgame/{game_id}`  
**Response**:  
XML response from BoardGameGeek API.

---

## **Error Handling**  
Responses for invalid requests:
- **400 Bad Request** – Missing parameters  
- **404 Not Found** – Resource not found  
- **500 Internal Server Error** – Server error  

---

## **Final Notes**  
- Ensure to replace `http://localhost:5000` with the actual deployment URL when using this API in production.  
- All date fields use ISO format (`YYYY-MM-DDTHH:MM:SS`).  

This API allows users to manage a board game catalogue, create and join games, schedule events, and fetch data from BoardGameGeek. 🚀