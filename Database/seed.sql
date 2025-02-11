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
    item_type enum('standalone','expansion');
    primary key (asset_id)
);

CREATE_TABLE user(
    user_id int not null auto_increment,
    user_name varchar(255), 
);

CREATE_TABLE event(

);

--Seed Data TODO: add this as needed using INSERT statements
