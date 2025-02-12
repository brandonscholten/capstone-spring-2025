USE boardandbevy

CREATE TABLE catalogue (
    asset_id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    num_plays INT DEFAULT 0,
    own BOOLEAN DEFAULT FALSE,
    for_trade BOOLEAN DEFAULT FALSE,
    min_players INT NOT NULL,
    max_players INT NOT NULL,
    max_playtime INT,
    min_playtime INT,
    year_published INT,
    item_type ENUM('standalone', 'expansion') NOT NULL,
    PRIMARY KEY (asset_id)
);

CREATE TABLE users (
    user_id INT NOT NULL AUTO_INCREMENT,
    user_name VARCHAR(255) NOT NULL UNIQUE,
    user_pass VARCHAR(255) NOT NULL,
    PRIMARY KEY (user_id)
);

CREATE TABLE event (
    event_id INT NOT NULL AUTO_INCREMENT,
    asset_id INT, 
    custom_game_title VARCHAR(255),
    event_time DATETIME NOT NULL, 
    event_name VARCHAR(255) NOT NULL,
    event_description TEXT NOT NULL,
    number_of_participants INT NOT NULL CHECK (number_of_participants > 0),
    user_id INT NOT NULL,
    PRIMARY KEY (event_id),
    FOREIGN KEY (asset_id) REFERENCES catalogue(asset_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
