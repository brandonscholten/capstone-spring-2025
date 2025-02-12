--Database Schema

CREATE_TABLE catalogue(
    asset_id int not null auto_increment,
    title varchar(255),
    rating int,
    num_plays int, 
    own bit, 
    for_trade bit,
    min_players int,
    max_players int,
    max_playtime int,
    min_playtime int,
    year_published int, 
    item_type enum('standalone','expansion'),
    primary key (asset_id)
);

CREATE_TABLE user(
    user_id int not null auto_increment,
    user_name varchar(255), 
    user_pass varchar(255),
    primary key (user_id)
);

CREATE_TABLE event(
    event_id int not null auto_increment,
    game_title varchar(255) not null,
    custom_game_title varchar(255), 
    event_time time not null, 
    event_name varchar(255) not null,
    event_description varchar(255) not null,
    number_of_participants int not null, 
);

--Seed Data TODO: add this as needed using INSERT statements
