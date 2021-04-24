"""
Implement the functions responsible for handling the Lichess API requests
and building the moves history obtained from those requests.
"""
import json
import requests
from helpers import increment_move_in_moves_dict, create_move_in_moves_dict


def get_lichess_moves_history(username, color, rating, time_class, time_control):
    """
    Construct the moves history from lichess archives
    """
    # Check if a time class was selected
    if time_class:
        params = {"perfType": time_class, "color": color}
    else:
        # If no time class was selected, request all time classes
        # corresponding to the standard variant of chess
        params = {"perfType": ["ultrabullet,bullet,blitz,rapid,classical"],
                  "color": color}

    # Make the request to lichess API
    try:
        response = requests.get(
                            f"https://lichess.org/api/games/user/{username}",
                            params=params,
                            headers={"Accept": "application/x-ndjson"}
        )
        response.raise_for_status()
    except requests.RequestException:
        return None

    # Remove \n to turn the ndjson file into a json file
    response_text = response.content.decode("utf-8")

    # Check if any game was loaded
    if not response_text:
        return None

    games = [json.loads(s) for s in response_text.split("\n")[:-1]]

    # with open("lichess.json", 'w') as outfile:
    #    json.dump(games, outfile)

    moves_history = {"next_moves": {}}

    # Iterate through the games to parse the moves
    for game in games:
        # Filter by rating
        if rating:
            if int(game["players"][color]["rating"]) < rating:
                continue

        # Filter by time control
        if time_control:
            initial_time, increment = time_control.split("+")
            if int(initial_time) != game["clock"]["initial"]:
                continue
            if int(increment) != game["clock"]["increment"]:
                continue

        # Get game result and parse the game if it was not catch by the filters
        if "winner" not in game:
            # If there is no "winner" property, the game was drawn
            result = 0.5
        elif game["winner"] == "white":
            result = 1
        else:
            result = 0

        parse_pgn(moves_history, game["moves"], result)

    return moves_history


def parse_pgn(moves_dict, pgn, result):
    """
    Parse PGN file saving the moves in the moves dictionary
    """

    moves = pgn.split()

    current_dict = moves_dict

    # Add the moves to the dictionary
    for move in moves:
        # Check if this move was already played in this position
        if move in current_dict["next_moves"]:
            increment_move_in_moves_dict(current_dict, move, result)
        else:
            create_move_in_moves_dict(current_dict, move, result)

        # Update current_dict
        current_dict = current_dict["next_moves"][move]
