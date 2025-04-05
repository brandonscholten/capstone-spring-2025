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
from dateutil import parser
from datetime import datetime
import dateparser
from datetime import datetime
import json
import os
import typing
import re
import pytz
class Messages(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

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

        #Keep ahold of the last message that was sent
        lastMessage = None

        # Send the messages as ephemeral
        # The first message uses response.send_message; subsequent ones are sent as follow-ups.
        # Keep the last message sent as that will be the message to add interactions for RSVP functionality
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
        halfPrivateRoom = False
        game_date = game_date
        game_time = game_time
        game_name = game_name
        game_description = None
        game_max_players = game_max_players
        firstLastName = None
        game_end_time = None

        


        print(f"The games date: f{game_date}")

        def validISO8601Date(date):
            dt = dateparser.parse(date,  settings={'TIMEZONE': 'US/Eastern'})

            print(f'validISO8601Date parse: {dt}')
            if dt:
                #Make it timezone aware!!
                #This is key to getting the correctly adjusted UTC time from EST!
                if dt.tzinfo is None:
                    eastern_timeZone = pytz.timezone('US/Eastern')
                    dt = eastern_timeZone.localize(dt)

                print(f'ISO Format: {dt.isoformat()}')
                return dt.isoformat()
            return None
            



        

        #Will be used to ensure a int is given for the number of players
        def validPlayerInteger(numOfPlayers):
            print("Checking player numbers")

            try: 
                int(numOfPlayers)
            except ValueError:
                return False
        
            return True
                

        #print(event_time)

        #await interaction.response.pong()
        

        #Send a message to create a thread on (have to without the server being Nitro boosted)
        threadStarter = (await interaction.response.send_message("Creating a thread to schedule, please open the thread to continue (The thread will be deleted after)")).resource

        #
        #   Thread creation
        #
        thread = await threadStarter.create_thread(name=f"{usersName}'s Game Thread")
        
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
                game_name = gameNameResponse.content
                print("Collected the game name!")
            except TimeoutError:
                thread.send("Timeout reached, please try creating an game again")



        #
        #Ask for the max number of players of the event if it was not filled out in the command
        #


        def maxPlayersCheck(message):
             return message.author == usersObject and message.channel == thread


        #Make a while loop to ensure the proper type
        while True:
            if game_max_players == None:
                #No players were given as input
                print(type(game_max_players))

                #Now prompt the user for the max number of players
                #Prompt for the name
                await thread.send("Please send the max number of players for your game (NOTE: Games with 10 or more max players will be required to rent the back room)")

                #Now try and wait for the user to respond in 60 seconds, if nothing, then error out
                try:
                    maxNumberOfPlayers = await self.bot.wait_for('message', timeout=60, check=maxPlayersCheck)
                    print(maxNumberOfPlayers.content)
                    game_max_players = maxNumberOfPlayers.content
                    #print("Collected the game name!")
                except TimeoutError:
                    await thread.send("Timeout reached, please try creating an game again")
            else:
                #Number was provided through the command arguments, so take its contents and assign it
                print(type(game_max_players))
                game_max_players = game_max_players
                print(game_max_players)

            #Now check if it can be casted as an int
            if validPlayerInteger(game_max_players):
                #True, so now just convert to int and then save it to the variable
                game_max_players = int(game_max_players)
                break
            else:
                #False, clear the variable to be None and reprompt
                game_max_players = None

        #Collect the game description
        if game_description == None:
            def gameDescriptionCheck(message):
             return message.author == usersObject and message.channel == thread

            #Prompt for the name
            await thread.send("Please send the description of your game")

            #Now try and wait for the user to respond in 60 seconds, if nothing, then error out
            try:
                gameDescriptionResponse = await self.bot.wait_for('message', timeout=60, check=gameDescriptionCheck)
                game_description = gameDescriptionResponse.content
                print("Collected the game name!")
            except TimeoutError:
                thread.send("Timeout reached, please try creating an game again")


        #Date validation
        #This will be looped so then it keeps asking for valid input to ensure ISO8601 is met
        #Message checker to ensure the proper channel and user that sends a response is picked up
        def gameDateChecker(message):
             return message.author == usersObject and message.channel == thread


        #Date validation
        while (True):
             
            #This will run the checker only if the date was already provided
            if game_date != None:
                game_date = game_date
                game_date_valid = (game_date)
                print("date provided")
            else:
                print("NO date provided")

                #Now ask for the date since there is none there
                await thread.send("Please enter your games date (format: Today at 6PM, March 13, 2026 at 5:30PM, 6PM [Note: This will do the current day!])")

                #Wait for their response
                try:
                    response = await self.bot.wait_for("message", timeout=60, check=gameDateChecker)

                    #Now set the date to what was received from the user
                    game_date = response.content
                    print(game_date)
                except TimeoutError:
                    print("Timeout")

            print(f"valid ISO7601?: {validISO8601Date(game_date)}")
            if validISO8601Date(game_date) == None:
                game_date = None
                
            else:
                #Clear the date after this point, because it is not valid
                #Would have already broke out if it was
                game_date = validISO8601Date(game_date)
                break


        def gameTimeChecker(message):
            return message.author == usersObject and message.channel == thread


        #Collect time
        while (True):
            
            #This will run the checker only if the date was already provided
            if game_end_time != None:
                game_end_time = game_end_time
                print("time provided")
            else:
                print("NO time provided")

                #Now ask for the date since there is none there
                await thread.send("Please send the end time for the game (format: March 13th, 2026 at 6PM, Today at 9PM, 9PM [This will be for the current day at 9PM])")

                #Wait for their response
                try:
                    response = await self.bot.wait_for("message", timeout=60, check=gameTimeChecker)

                    #Now set the date to what was received from the user
                    game_end_time = response.content
                    print(game_end_time)
                except TimeoutError:
                    print("Timeout")

            print(f"valid ISO7601?: {validISO8601Date(game_end_time)}")
            if validISO8601Date(game_end_time) == None:
                game_end_time = None
                
            else:
                #Clear the date after this point, because it is not valid
                #Would have already broke out if it was
                game_end_time = validISO8601Date(game_end_time)
                break



        



        #
        # Parties 10 or larger are required to rent out the back room,
        # Make an auto yes if 10 or larger
        #
        if game_max_players >= 10:

            privateRoomRequest = True

            #Ask if the person would like to book the private room for the event?
            halfOrFullRoom = await thread.send("For the private room (Room required with games of 10 or more people), full or half? \n\n 🟩 - Full \n\n 🟥- Half ")

            #Grab the message to then add the valid reactions to make it easier on the user
            # = await interaction.original_response()

            #Adds in the options for valid reactions
            await halfOrFullRoom.add_reaction("🟩")
            await halfOrFullRoom.add_reaction("🟥")

            #Await for the user to react to the message
            try:
                reaction, user = await self.bot.wait_for('reaction_add', timeout=60)
                if str(reaction.emoji) == "🟩":
                    #Not wanting half, wanting full
                    halfPrivateRoom = False
                elif str(reaction.emoji) == "🟥":
                    #Wanting half not full
                    halfPrivateRoom = True


                #
            except TimeoutError:
                await thread.send("Time out awaiting for a reaction, please try again")


            #Now grab the users first and last name to allow for booking to be matched with actual store receipt
            def firstLastNameCheck(message):
                return message.author == usersObject and message.channel == thread

            #Prompt for the name
            await thread.send("Please send your first and last name, this will be used to confirm you have paid once you arrive for your private room booking:")

            #Now try and wait for the user to respond in 60 seconds, if nothing, then error out
            try:
                firstLastNameResponse = await self.bot.wait_for('message', timeout=60, check=firstLastNameCheck)
                firstLastName = firstLastNameResponse.content
                print("Collected First and Last name")
            except TimeoutError:
                thread.send("Timeout reached, please try creating an game again")

        else:


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

            
            
            if privateRoomRequest == True:
                #Ask if the person would like to book the private room for the event?
                halfOrFullRoom = await thread.send("For the private room (Room required with games of 10 or more people), full or half? \n\n 🟩 - Full \n\n 🟥- Half ")

                #Grab the message to then add the valid reactions to make it easier on the user
                # = await interaction.original_response()

                #Adds in the options for valid reactions
                await halfOrFullRoom.add_reaction("🟩")
                await halfOrFullRoom.add_reaction("🟥")

                #Await for the user to react to the message
                try:
                    reaction, user = await self.bot.wait_for('reaction_add', timeout=60)
                    if str(reaction.emoji) == "🟩":
                        #Not wanting half, wanting full
                        halfPrivateRoom = False
                    elif str(reaction.emoji) == "🟥":
                        #Wanting half not full
                        halfPrivateRoom = True



                #
                except TimeoutError:
                    await thread.send("Time out awaiting for a reaction, please try again")


                #Now grab the users first and last name to allow for booking to be matched with actual store receipt
                def firstLastNameCheck(message):
                    return message.author == usersObject and message.channel == thread

                #Prompt for the name
                await thread.send("Please send your first and last name, this will be used to confirm you have paid once you arrive for your private room booking:")

                #Now try and wait for the user to respond in 60 seconds, if nothing, then error out
                try:
                    firstLastNameResponse = await self.bot.wait_for('message', timeout=60, check=firstLastNameCheck)
                    firstLastName = firstLastNameResponse.content
                    print("Collected First and Last name")
                except TimeoutError:
                    thread.send("Timeout reached, please try creating an game again")








                await interaction.followup.send("Thank you for scheduling your game, the thread is now locked!\n An admin will approve or deny your request for the private room")
            else:
                await interaction.followup.send("Thank you for scheduling your game, the thread is now locked!\n An reminder will be sent an hour before your game")

        #Ensure no one can edit the thread
        await thread.edit(locked=True)

        #Remove them from the thread
        await thread.remove_user(usersObject)

        #Delete thread
        await thread.delete()

        #
        #  Admin channel message for game approval ONLY IF PRIVATE ROOM IS WANTED
        #
        if privateRoomRequest:
            #Send the room request to the admin channel
            await sendApprovalMessageToAdminChannel(self.bot, None, usersID, usersName, game_name, game_description,
                                              game_max_players, game_date, game_end_time, halfPrivateRoom, firstLastName, privateRoomRequest, None)

    
#Sends a DM (given in the parameter) to the discord user by their ID
async def DMDiscordServerMember(bot, discordUserID, message):
    userObject = await bot.fetch_user(discordUserID)
    await userObject.send(message)

async def sendApprovalMessageToAdminChannel(bot, email, usersDiscordID, usersName, game_name, game_description, 
                                            game_max_players, game_date, game_end_time, halfPrivateRoom, firstLastName, 
                                            privateRoomRequest, password):
    #We need to message the admin channel with the request
    #TODO: REPLACE THE ADMIN CHANNEL KEY IT PULLS WITH BOARD & BEVY'S CURRENTLY USING A TEST ONE (THE DEV DISCORD SERVER)
    gameApprovalChanel = await bot.fetch_channel(os.getenv("TEST_ADMIN_CHANNEL"))

    #Approval flag for the post
    gameApproved = False

    
    #Date conversions from UTC to EST

    #1. Make the datetime object from the game date
    game_date_formatted = datetime.fromisoformat(game_date)
    game_end_time_formatted = datetime.fromisoformat(game_end_time)

    #Convert to EST
    game_date_formatted = game_date_formatted.astimezone(pytz.timezone('US/Eastern'))
    game_end_time_formatted = game_end_time_formatted.astimezone(pytz.timezone('US/Eastern'))

    #Formate the date and time to 12 hr
    game_date_formatted = game_date_formatted.strftime("%m-%d-%Y %I:%M %p")
    game_end_time_formatted = game_end_time_formatted.strftime("%m-%d-%Y %I:%M %p")

    #Build the Admin channel message for approvals:

    #This will change to email or usersName based on if Discord or Website was used
    if email == None:
        #Discord bot was used
        approvalMessage = f' The user {usersName} is requesting the following game, details are below, react to approve or deny the request\n'
    elif usersDiscordID == None:
        #Email was used
        approvalMessage = f' The user with the email {email} is requesting the following game, details are below, react to approve or deny the request\n'

    approvalMessage += f'* Game Name: {game_name}\n'
    approvalMessage += f'* Max Number Of Players: {game_max_players}\n'
    approvalMessage += f'* Description: \n {game_description}\n'
    approvalMessage += f'* Date and Start Time: \n {game_date_formatted}\n'
    approvalMessage += f'* End Time: \n {game_end_time_formatted}\n'

    print(f'Half room wants: {halfPrivateRoom}')
    #Add in the full or half room booking
    if halfPrivateRoom:
        approvalMessage += "* Half Room Wanted\n"
    else:
        approvalMessage += "* Full Room Wanted\n"

    #Add in their first and last name to the approval message:
    approvalMessage += f'* Reservation Name: {firstLastName}'

    denyMessageReason = None

    #Grab the user
    if email == None:
        usersObject = await bot.fetch_user(usersDiscordID)

    #Send the message
    gameApprovalMessage = await gameApprovalChanel.send(approvalMessage)

    #Now add the interactions to the event
    await gameApprovalMessage.add_reaction('👍')
    await gameApprovalMessage.add_reaction('👎')

    def gameApprovalCheck(reaction, channel):
        print("doing the check!")
        print(f'Channel: {channel}')
        return reaction.message.id == gameApprovalMessage.id

    try:
        reaction, channel = await bot.wait_for('reaction_add', check=gameApprovalCheck)
        if str(reaction.emoji) == '👍':
            print("Thumbs up!!!")

            gameApproved = True
            calendar = {
                "title": f"{usersName}'s Event ({"Full Room" if not halfPrivateRoom else "Half Room"})",
                "description": game_description,
                "start_time": game_date,
                "end_time": game_end_time, # e.g., "2025-03-20T16:00:00Z"
                "force": False
            }
            #Then send this off with requests
            calendar_response = requests.post('http://127.0.0.1:5000/create-game', json=calendar)
            if calendar_response.status_code == 409:
                calendarErrorMessage = await gameApprovalChanel.send("The Back Room is full at this time, Take a look at the [calendar](https://calendar.google.com/calendar/u/0?cid=Ym9hcmRuYmV2eUBnbWFpbC5jb20) to double check if you'd like to add it anyways Approve this message")
                
                def calendarOverrideCheck(reaction, channel):
                    return reaction.message.id == gameApprovalMessage.id

                #Add the reactions
                await calendarErrorMessage.add_reaction("👍")
                await calendarErrorMessage.add_reaction("👎")
                
                try:
                    reaction, user = bot.wait_for("reaction_add", check=calendarOverrideCheck)

                    if str(reaction.emoji) == "👍":
                        calendar['force'] = True
                        requests.post('http://127.0.0.1:5000/create-game', json=calendar)
                        r = requests.post("http://127.0.0.1:5000/games", json=gameDict)
                    elif str(reaction.emoji) == "👎":
                        deny_request(bot, gameApprovalMessage, usersDiscordID, email)
                        #Reject This Game
                        print("Rejected the override")    
                except Exception as e:
                    print(f"ERROR at calendar override reaction: {e}")
        
            approvalDM = "Please ensure you pay for your private room reservation prior to your event start time using the links below! \n"
        
            #True -> Requesting a Private Room
            #False -> Does not want a Private Room
            if privateRoomRequest:
                # True -> Half Room Booking Wanted
                # False -> Full Room Booking Wanted
                if halfPrivateRoom:
                    #Half room is wanted
                    approvalDM += f"Ensure you pay for the **half room** reservation at (use the name of {firstLastName} for the reservation): [Reservation Link](https://www.boardandbevy.com/product-page/half-room-reservation)"
                else:
                    #Full room wanted
                    approvalDM += f"Ensure you pay for the **full room** reservation at (use the name of {firstLastName} for the reservation): [Reservation Link](https://www.boardandbevy.com/product-page/whole-backroom-reservation)"

            #
            #   Email or Discord DM code goes here
            #
            if email == None:
                #Discord DM the user of their approval
                #Now dm the requester to tell them it has been approved
                await usersObject.send(f"Your request has been approved for {game_date_formatted} ending at {game_end_time_formatted}.\n A reminder 1 hour before the event will be directly sent to you.")
                await usersObject.send(approvalDM)
            elif email != None:
                print ("Email the user their APPROVAL")
                
                #email code goes here

        elif str(reaction.emoji) == '👎':
            deny_request(bot, gameApprovalMessage, usersDiscordID, email)
    except Exception as e:
        print(f"Exception: {e}")
    

    print(f"game_date type: {type(game_date)}")

    if gameApproved: 
        
        #
        #   Send API endpoint request
        #

        #Now, after everything has been confirmed, build the JSON to be sent to the API
        gameDict = {
            "title": game_name,
            "organizer": usersName,
            "startTime": game_date,
            "endTime": game_end_time,
            "description": game_description,
            "password": None,
            "image": None,
            "players": game_max_players,
            "participants": usersDiscordID,
            "catalogue_id": None
        }

        #Add the password, if present 
        if password != None:
            updatedGameDict = {
                "title": game_name,
                "organizer": usersName,
                "startTime": game_date,
                "endTime": game_end_time,
                "description": game_description,
                "password": password,
                "image": None,
                "players": game_max_players,
                "participants": usersID,
                "catalogue_id": None
            }
            
            gameDict.update(updatedGameDict)
        else:
            r = requests.post("http://127.0.0.1:5000/games", json=gameDict)

        

async def deny_request(bot, gameApprovalMessage, usersDiscordID, email):
    
    optionalDenyMessagePrompt = await gameApprovalMessage.reply("Would you like to send a reason for denying the event?")

    #Add the reactions
    await optionalDenyMessagePrompt.add_reaction("👍")
    await optionalDenyMessagePrompt.add_reaction("👎")

    try:
        denyMessageReasonReaction, user = await bot.wait_for("reaction_add")

        print(denyMessageReasonReaction.emoji)

        if str(denyMessageReasonReaction.emoji) == '👍':
        #Collect the reason
            await optionalDenyMessagePrompt.reply("Please send your reason")

            try:
                def denyMessageResponseCheck(message):
                    return message.author == user and message.channel == gameApprovalMessage.channel
                                
                denyMessageReason = await bot.wait_for('message', timeout=60, check=denyMessageResponseCheck)
                print(f'Deny message reason in try: {denyMessageReason}')
            except TimeoutError:
                #  print("hello world")
                #  thread.send("Timeout reached, sending rejection with no reason")
                print()
            except Exception as e:
                print(f'DENIAL MESSAGE ERROR: {e}')       
                
            print(denyMessageReason)

    #Now print a follow-up message, asking for an optional reason

        denialMessage = "Your request has been **denied**"

        if denyMessageReason != None: 
            #There is a deny message, then append it to the string
            denialMessage += f', please find the reason below \n{denyMessageReason.content}'
                
        #Run a check here to sed if an email message or a discord DM is sent to
        #the user to notify them of their denied game
        print(email)
        if email == None:
            #The DM command is here
            await DMDiscordServerMember(bot, usersDiscordID, denialMessage)
        elif email != None:
            print("Email the user their DENIAL")

            #Put code to email user!!
                
    except Exception as e:
        print(f'ERROR: {e}')

    



#Adds the cog to the bot
async def setup(bot):
    await bot.add_cog(Messages(bot))
