
import pandas as pd
import requests
import xml.etree.ElementTree as ET 

def load_catalogue_from_csv():
    with open('./collection (1).csv', 'r') as file:
        df = pd.read_csv(file)
        for row in df.itertuples():
            url = f"https://boardgamegeek.com/xmlapi/search?search={requests.utils.quote(row.objectname)}&exact=1"
            for child in ET.fromstring(requests.get(url).content):
                if child.attrib['objectid']:
                    json = parse_boardgame_xml(requests.get(f"https://boardgamegeek.com/xmlapi/boardgame/{child.attrib['objectid']}?stats=1").content)
                    if json:
                        requests.post("http://localhost:5000/catalogue", json=json)  # Adjust the URL as needed


def parse_boardgame_xml(xml_text):
    root = ET.fromstring(xml_text)
    boardgame_node = root.find("boardgame")

    if not boardgame_node:
        return {}

    # Extract Title
    new_title = ""
    name_nodes = boardgame_node.findall("name")
    for name in name_nodes:
        if name.get("primary") == "true":
            new_title = name.text
            break
    if not new_title and name_nodes:
        new_title = name_nodes[0].text

    # Extract Publisher
    publisher_nodes = boardgame_node.findall("boardgamepublisher")
    new_publisher = publisher_nodes[0].text if publisher_nodes else ""

    # Extract Description
    desc_node = boardgame_node.find("description")
    new_description = desc_node.text if desc_node is not None else ""

    # Extract Release Year
    year_node = boardgame_node.find("yearpublished")
    new_release_year = year_node.text if year_node is not None else ""

    # Extract Thumbnail Image
    thumbnail_node = boardgame_node.find("thumbnail")
    new_image = thumbnail_node.text if thumbnail_node is not None else ""

    # Extract Player Count
    min_players_node = boardgame_node.find("minplayers")
    max_players_node = boardgame_node.find("maxplayers")
    if min_players_node is not None and max_players_node is not None:
        new_players = (
            min_players_node.text
            if min_players_node.text == max_players_node.text
            else f"{min_players_node.text}-{max_players_node.text}"
        )
    else:
        new_players = ""

    # Extract Duration
    min_playtime_node = boardgame_node.find("minplaytime")
    max_playtime_node = boardgame_node.find("maxplaytime")
    if min_playtime_node is not None and max_playtime_node is not None:
        min_time = "Unknown" if min_playtime_node.text == "0" else min_playtime_node.text
        max_time = "Unknown" if max_playtime_node.text == "0" else max_playtime_node.text
        new_duration = min_time if min_time == max_time else f"{min_time}-{max_time}"
    else:
        new_duration = "Unknown"

    # Extract Difficulty (Average Weight)
    new_difficulty = ""
    statistics_node = boardgame_node.find("statistics")
    print(statistics_node.text)

    if statistics_node is not None:
        ratings_node = statistics_node.find("ratings")
        if ratings_node is not None:
            average_weight_node = ratings_node.find("averageweight")
            if average_weight_node is not None:
                new_difficulty = average_weight_node.text

    return {
        "title": new_title,
        "publisher": new_publisher,
        "description": new_description,
        "yearpublished": new_release_year,
        "image": new_image,
        "players": new_players,
        "duration": new_duration,
        "difficulty": new_difficulty
    }



if __name__ == "__main__":
    load_catalogue_from_csv()