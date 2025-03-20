#######################################
#                                     #
# Bot & Bevy                          #
#                                     #
# Discord Bot Message Cog &           #
# Application Commands                #
#                                     #
# Handles Messaging, DM, & API        #
# Calls for the Discord Bot           #
#                                     #
#                                     #
# Created By: Elliott Hager           #
# Last Modified: 2/27/2025            #
#######################################

import discord
from discord.ext import commands
from discord import app_commands
import requests
from dotenv import load_dotenv, dotenv_values
import os
import typing
import re
class Messages(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="list_events", description="Creates an event and allows users to RSVP")
    async def listevents(self, interaction: discord.Interaction):
        # Temp list to hold items to list out the events
        return

    @app_commands.command(name="list_games", description="Lists the current game collection of Board & Bevy")
    @app_commands.describe(
        sort_by="Sort by one of: name, players, difficulty, or time",
        filter_title="Filter by title substring (e.g., 'Catan')",
        filter_players="Filter by players (e.g., '4'; supports ranges like '2-6' in the game data)",
        filter_difficulty="Filter by difficulty (e.g., '3.5')",
        filter_duration="Filter by duration (e.g., '60'; supports ranges like '60-90' in the game data)"
    )
    async def listGames(
        self,
        interaction: discord.Interaction,
        sort_by: str = "name",
        filter_title: str = "",
        filter_players: str = "",
        filter_difficulty: str = "",
        filter_duration: str = ""
    ):
        # Call API to get the game catalogue
        response = requests.get("http://127.0.0.1:5000/catalogue")
        games = response.json()
        print(games)
        
        # Helper function: Check if a number matches a range string (e.g., "2-6")
        def check_range_match(value: str, filter_val: str) -> bool:
            try:
                filter_num = int(filter_val)
            except ValueError:
                return False
            match = re.search(r'(\d+)\s*-\s*(\d+)', value)
            if match:
                min_val = int(match.group(1))
                max_val = int(match.group(2))
                return min_val <= filter_num <= max_val
            else:
                try:
                    return int(value) == filter_num
                except ValueError:
                    return False

        # Helper function: Extract a number from a string (for sorting ranges, we use the lower bound)
        def extract_min(value: str) -> int:
            match = re.search(r'(\d+)', value)
            if match:
                return int(match.group(1))
            return 0

        # Filter the games based on provided parameters
        filtered_games = []
        for game in games:
            # Title filter: check if filter_title is a substring (case-insensitive)
            title = game.get("title", "")
            matches_title = filter_title.lower() in title.lower() if filter_title else True

            # Players filter: check if the game players match the filter
            players = game.get("players", "")
            matches_players = check_range_match(players, filter_players) if filter_players else True

            # Difficulty filter: check if the game difficulty is within 0.55 of the filter value
            matches_difficulty = True
            if filter_difficulty:
                try:
                    game_diff = float(game.get("difficulty", 0))
                    filter_diff = float(filter_difficulty)
                    if abs(game_diff - filter_diff) > 0.55:
                        matches_difficulty = False
                except ValueError:
                    matches_difficulty = False

            # Duration filter: check if the game duration matches the filter
            duration = game.get("duration", "")
            matches_duration = check_range_match(duration, filter_duration) if filter_duration else True

            if matches_title and matches_players and matches_difficulty and matches_duration:
                filtered_games.append(game)

        # Sort the filtered games based on the sort_by parameter
        sort_by = sort_by.lower()
        if sort_by == "name":
            sorted_games = sorted(filtered_games, key=lambda g: g.get("title", "").lower())
        elif sort_by == "players":
            sorted_games = sorted(filtered_games, key=lambda g: extract_min(g.get("players", "")))
        elif sort_by == "difficulty":
            sorted_games = sorted(filtered_games, key=lambda g: float(g.get("difficulty", 0)))
        elif sort_by in ["time", "duration"]:
            sorted_games = sorted(filtered_games, key=lambda g: extract_min(g.get("duration", "")))
        else:
            sorted_games = filtered_games

        # Build the response string with bullet points for each game title
        if not sorted_games:
            gameString = "No games found matching your criteria."
        else:
            gameString = "\n".join(f"* {game.get('title', 'Unknown Title')}" for game in sorted_games)

        # Function to split a long message into chunks not exceeding Discord's 2000 character limit
        def split_message(message: str, limit: int = 2000):
            lines = message.split('\n')
            parts = []
            current_part = ""
            for line in lines:
                # +1 for the newline
                if len(current_part) + len(line) + 1 > limit:
                    parts.append(current_part)
                    current_part = line
                else:
                    current_part = line if not current_part else current_part + "\n" + line
            if current_part:
                parts.append(current_part)
            return parts

        # Split the message if needed
        message_parts = split_message(gameString)

        # Send the messages as ephemeral
        # The first message uses response.send_message; subsequent ones are sent as follow-ups.
        await interaction.response.send_message(message_parts[0], ephemeral=True)
        for part in message_parts[1:]:
            await interaction.followup.send(part, ephemeral=True)
    
    
    
    @app_commands.command(name="create_game", description="Creates an game and allows users to RSVP")
    @app_commands.describe(game_name="the name of the game")
    @app_commands.describe(game_max_players="The max number of players")
    @app_commands.describe(game_date="date of the game (format: mm/dd/yyy)")
    @app_commands.describe(game_time="date of the game (format: HH:MM AM/PM)")
    async def createGame(self, interaction: discord.Interaction, game_name: typing.Optional[str], game_max_players: typing.Optional[int], game_date: typing.Optional[str], game_time: typing.Optional[str]):
        usersID = interaction.user.id
        usersName = interaction.user.name
        usersObject = await self.bot.fetch_user(usersID)
        privateRoomRequest = False
        game_date = game_date
        game_time = game_time
        game_name = game_name
        game_description = None
        game_max_players = game_max_players

        #Function to ensure the date and time are valid formats for ISO8601
        def validISO8601Date(date):
            print("Checking Date!")


        #print(event_time)

        #await interaction.response.pong()
        

        #Send a message to create a thread on (have to without the server being Nitro boosted)
        threadStarter = (await interaction.response.send_message("Creating a thread to schedule, please open the thread to continue (The thread will be locked after)")).resource

        #
        #   Thread creation
        #
        thread = await threadStarter.create_thread(name="Test Thread")
        
        #Add the user to the thread
        await thread.add_user(usersObject)

        #Now mark it as archived so then only the user added to the thread can send messages
        await thread.edit(archived=True)

        #
        #Ask for the name of the event if it was not filled out in the command
        #
        print(game_name)
        if game_name == None:
            def gameNameCollectionCheck(message):
             return message.author == usersObject and message.channel == thread

            #Prompt for the name
            await thread.send("Please send the name of your game")

            #Now try and wait for the user to respond in 60 seconds, if nothing, then error out
            try:
                gameNameResponse = await self.bot.wait_for('message', timeout=60, check=gameNameCollectionCheck)
                game_name = gameNameResponse
                print("Collected the game name!")
            except TimeoutError:
                thread.send("Timeout reached, please try creating an game again")

        #
        #Ask for the max number of players of the event if it was not filled out in the command
        #
        def isPlayerMaxAInt(maxPlayers):
            return type(maxPlayers) == int


        print(game_max_players)
        if game_max_players == None:
            def maxPlayersCheck(message):
             return message.author == usersObject and message.channel == thread

            #Prompt for the name
            await thread.send("Please send the max number of players for your game")

            #Now try and wait for the user to respond in 60 seconds, if nothing, then error out
            try:
                maxNumberOfPlayers = await self.bot.wait_for('message', timeout=60, check=maxPlayersCheck)
                game_max_players = maxNumberOfPlayers
                #print("Collected the game name!")
            except TimeoutError:
                thread.send("Timeout reached, please try creating an game again")


        #Collect the game description
        if game_description == None:
            def gameDescriptionCheck(message):
             return message.author == usersObject and message.channel == thread

            #Prompt for the name
            await thread.send("Please send the description of your game")

            #Now try and wait for the user to respond in 60 seconds, if nothing, then error out
            try:
                gameDescriptionResponse = await self.bot.wait_for('message', timeout=60, check=gameDescriptionCheck)
                game_description = gameDescriptionResponse
                print("Collected the game name!")
            except TimeoutError:
                thread.send("Timeout reached, please try creating an game again")


        #Ask if the person would like to book the private room for the event?
        privateRoomWanted = await thread.send("Would you like to book a private room for the game (Can do half and full room)? \n\n 👍 - Yes \n\n 👎- No ")

        #Grab the message to then add the valid reactions to make it easier on the user
        # = await interaction.original_response()

        #Adds in the options for valid reactions
        await privateRoomWanted.add_reaction("👍")
        await privateRoomWanted.add_reaction("👎")

        #Await for the user to react to the message
        try:
            reaction, user = await self.bot.wait_for('reaction_add', timeout=60)
            if str(reaction.emoji) == "👍":
                #await thread.send("If you would like to book the backroom for this event, please visit one of the two links below:\n HALF ROOM \n FULL ROOM")
                privateRoomRequest = True
            elif str(reaction.emoji) == "👎":
                privateRoomRequest = False


            #
        except TimeoutError:
            await thread.send("Time out awaiting for a reaction, please try again")

        
        
        
        await interaction.followup.send("Thank you for scheduling your game, the thread is now locked!\n An admin will approve or deny your request")

        #Ensure no one can edit the thread
        await thread.edit(locked=True)

        #Remove them from the thread
        #await thread.remove_user(usersObject)


        #
        #  Admin channel message for game approval
        #

        #We need to message the admin channel with the request
        #TODO: REPLACE THE ADMIN CHANNEL KEY IT PULLS WITH BOARD & BEVY'S CURRENTLY USING A TEST ONE (THE DEV DISCORD SERVER)
        gameApprovalChanel = await self.bot.fetch_channel(os.getenv("TEST_ADMIN_CHANNEL"))

        #Build the Admin channel message for approvals:
        approvalMessage = f' The user {usersName} is requesting the following game, details are below\n'
        approvalMessage += f'* Game Name: {game_name.content}\n'
        approvalMessage += f'* Max Number Of Players: {game_max_players.content}\n'
        approvalMessage += f'* Description: \n {game_description.content}\n'
        approvalMessage += f'* Private Room Requested?: {privateRoomRequest}'

        gameApprovalMessage = await gameApprovalChanel.send(approvalMessage)

        denyMessageReason = None

        #Now add the interactions to the event
        await gameApprovalMessage.add_reaction('👍')
        await gameApprovalMessage.add_reaction('👎')

        def gameApprovalCheck(reaction, channel):
                print("doing the check!")
                print(f'Channel: {channel}')
                return reaction.message.id == gameApprovalMessage.id

        try:
           

           reaction, channel = await self.bot.wait_for('reaction_add', check=gameApprovalCheck)
           if str(reaction.emoji) == '👍':
            print("Thumbs up!!!")
            #Now dm the requester to tell them it has been approved
            await usersObject.send(f"Your request has been approved for {game_date} at {game_time}.\n A reminder 1 hour before the event will be directly sent to you.")
           elif str(reaction.emoji) == '👎':

               optionalDenyMessagePrompt = await gameApprovalMessage.reply("Would you like to send a reason for denying the event?")

               #Add the reactions
               await optionalDenyMessagePrompt.add_reaction("👍")
               await optionalDenyMessagePrompt.add_reaction("👎")

               try:
                   denyMessageReasonReaction, user = await self.bot.wait_for("reaction_add")

                   print(denyMessageReasonReaction.emoji)

                   if str(denyMessageReasonReaction.emoji) == '👍':
                     #Collect the reason
                     await optionalDenyMessagePrompt.reply("Please send your reason")

                     try:
                      def denyMessageResponseCheck(message):
                        return message.author == user and message.channel == gameApprovalMessage.channel
                            
                      denyMessageReason = await self.bot.wait_for('message', timeout=60, check=denyMessageResponseCheck)
                      print(f'Deny message reason in try: {denyMessageReason}')
                     except TimeoutError:
                                thread.send("Timeout reached, sending rejection with no reason")
               except Exception as e:
                   print(f'DENIAL MESSAGE ERROR: {e}')       
               
               print(denyMessageReason)

               #Now print a follow-up message, asking for an optional reason

               denialMessage = "Your request has been **denied**"

               if denyMessageReason != None:
                 #There is a deny message, then append it to the string
                 denialMessage += f', please find the reason below \n{denyMessageReason.content}'
                
               #Now send the message
               await usersObject.send(denialMessage)
               
        except Exception as e:
            print(f'ERROR: {e}')

        #Make a function to handle a check to ensure the correct DM id is used for interaction

    #@app_commands.command()
    #async def 
        


async def setup(bot):
    await bot.add_cog(Messages(bot))
