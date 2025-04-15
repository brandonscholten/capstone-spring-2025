#######################################
#                                     #
# Bot & Bevy                          #
#                                     #
# Discord Bot Configuration &         #
# Runner                              #
#                                     #
# Created By: Elliott Hager           #
# Last Modified: 2/27/2025            #
#######################################

import discord
from discord.ext import commands
import os
from dotenv import load_dotenv
from cogs.messages import sendApprovalMessageToAdminChannel
import asyncio
import redis
import json
from datetime import datetime, timedelta
import pytz
import requests

async def load_cogs(bot):
    cog_list = [
        'messages'
    ]
    for cog in cog_list:
        await bot.load_extension(f'cogs.{cog}')

async def run_bot():
    # Load the .env file
    load_dotenv()

    # Define our intents required for the bot
    intents = discord.Intents.default()
    intents.message_content = True
    intents.members = True
    intents.reactions = True

    bot = commands.Bot(command_prefix="/", intents=intents)

    #Add the RSVP reaction event
    #Making this a bot.event ensures this can fire EVERY time a reaction is added 
    @bot.event
    async def on_reaction_add(reaction, user):

        if user.bot:
            #Don't handle the reactions from the bot, only users
            return

        #Grabs the game/event message and chanel the RSVP is done in
        #Ensures this only fires for the specific channels and messages
        message = reaction.message
        channel = message.channel
        

        #Keeps a track of game or event type to ensure the proper API endpoint is called
        gameEventtype = None

        #Will only allow for a decrement of the number of players RSVPed if they RSVPd before
        previouslyRSVPd = False

        #Grabs the channel ID from the env file to ensure proper channel for reaction handling
        GAMES_CHANNEL_ID = int(os.getenv("GAMES_CHANNEL_ID"))
        EVENTS_CHANNEL_ID = int(os.getenv("EVENTS_CHANNEL_ID"))

        if channel.id not in {GAMES_CHANNEL_ID, EVENTS_CHANNEL_ID} :
            #Reaction was not in the games channel, so dont do anything
            return
        
        #Flag for the participant JSON
        if channel.id == GAMES_CHANNEL_ID :
            gameEventType = "game"
        elif channel.id == EVENTS_CHANNEL_ID:
            gameEventType = "event"
        
        #Now iterate through the reactions and remove only the
        #user that changed their RVSP status (reaction)
        for reactions in message.reactions:
            #Check if the new reaction (parameter) is not equal=
            #to the reaction found, remove it
            if reactions.emoji != reaction.emoji:
                #Update the flag specifically for going from 👍 to 👎
                if str(reaction.emoji) == '👎' and str(reactions.emoji) == '👍':
                    users = [u async for u in reactions.users()]
                    
                    if user in users:
                        previouslyRSVPd = True  # User changed from 👍 to 👎

                #Remove it
                users = [u async for u in reactions.users()]
                if user in users:
                    await reactions.remove(user)


        #Grabs the embed message
        embed = message.embeds[0]

        #Holds the new embed for accurate count of attending
        embedCopy = discord.Embed(title=embed.title,
        description=embed.description,
        color=discord.Color.green())

        #
        #   Handle reaction addition
        #
        if str(reaction.emoji) == '👍':
            print("RSVPing for the event")

            #Check for any other reaction and remove it (👎)
            
            
            #Get the game id and hold it, this will be for the JSON and posting to the backend
            gameID = None

            for field in embed.fields:
                print(f"{field}: {field.value}")
                if field.name == "\u200b":
                    print("Found the hidden field")
                    gameID = field.value
                    break

            print(f"gameID: {gameID}")

            #Make the JSON
            participantAddJSON = {
                "type": gameEventtype,
                "participant": user.id,
                "id": gameID
            }

            #Make the API call to add to the RSVP
            requests.post("http://127.0.0.1:5000/participants/add", json=participantAddJSON)

            #
            # Schedule the reminder!

            #
            #Grab the event time from message
            #

            #Make a default value for the startTime
            startTime = None

            #Hold the max players
            maxPlayers = None

            #Hold the current number attending
            numberAttending = None

            #Go through the fields and find the correct field of start time, players and number attending
            for field in embed.fields:
              if field.name == "Start Time":
                  startTime = field.value
              elif field.name == "Players":
                  maxPlayers = field.value
              elif field.name == "Number Attending":
                  numberAttending = field.value


            #Make the call to the new player calculation,
            #This is used more than once and makes the code easier
            #To debug and reuse
            await rsvpToGame(numberAttending, maxPlayers, reaction, message, user, embed, embedCopy)

            # Convert the start time from 12hr EST to 24hr UTC
            startTime = est12hrTo24hrUTC(startTime)



            # Convert the startTime into a datetime object
            startTime = datetime.fromisoformat(startTime)
            print(f"startTime: {startTime}")

            

            # Grab the current time to help get the seconds until the start of the 
            currentTime = (datetime.now(pytz.timezone("US/Eastern"))).astimezone(pytz.utc)


           

            reminder_time = startTime - timedelta(hours=1)
            delay = (reminder_time - currentTime).total_seconds()
            print(f"delay: {delay}")

            
            async def send_dm_reminder(message):
                  await asyncio.sleep(delay)

                  #Now check if the user is in the list of 👍reactions
                  thumbsUp = False

                  for reaction in message.reactions:
                    if str(reaction.emoji) == reaction_emoji:  # Check for 👍 emoji
                        # Check if the user is in the list of users who reacted with 👍
                        users_who_reacted = await reaction.users().flatten()  # Get a list of users who reacted
                        if user in users_who_reacted:
                            thumbsUp = True
                            # Do something if the user reacted with 👍
                            break

                  #Check and see if the uses still has a 👍 when time to remind, if not, then dont send it
                  if thumbsUp:         
                    print(f'message content: {message.content}')
                    await user.send("Your game is starting soon!", embed=message.embeds[0])

            if delay > 0:
                task = bot.loop.create_task(send_dm_reminder(message))  # ✅ This is the scheduling
                # scheduled_reminders[(user.id, message.id)] = task  # Store task to cancel later
            elif delay < 0:
                #Send an immediate reminder
                await user.send(f"Your game starts in under an hour", embed=message.embeds[0])

        elif str(reaction.emoji) == '👎':
            print("Not RSVping, or removing RSVP for the event")


            #Now remove from the embed
            #Hold the current number attending
            numberAttending = None

            #Go through the fields and find the correct field of start time, players and number attending
            for field in embed.fields:
              if field.name == "Number Attending":
                numberAttending = field.value


            #Call this function to handle the removal of the RSVP to a game in terms of message player going field
            # in embedded message
            await removeRSVPToGame(numberAttending, reaction, message, embed, embedCopy, previouslyRSVPd)


            #Unschedule the reminder


            #Get the game id and hold it, this will be for the JSON and posting to the backend
            gameID = None


            for field in embed.fields:
                print(f"{field}: {field.value}")
                if field.name == "\u200b":
                    print("Found the hidden field")
                    gameID = field.value
                    break

            print(f"gameID: {gameID}")

            #Make the JSON
            participantRemoveJSON = {
                "type": gameEventtype,
                "participant": user.id,
                "id": gameID
            }

            #Make the API call to add to the RSVP
            requests.post("http://127.0.0.1:5000/participants/remove", json=participantRemoveJSON)


    # When the bot is ready, sync commands and start the Redis listener
    @bot.event
    async def on_ready():
        print("Bot is getting ready")
        await bot.tree.sync()
        print("Bot is ready")
        # Start the background task that listens to Redis for new events and games.
        bot.loop.create_task(redis_listener(bot))

    await load_cogs(bot)
    return bot

def redis_subscriber():
    """
    Sets up and returns a Redis PubSub subscriber.
    Adjust the host, port, or db if needed.
    """
    r = redis.Redis(host='localhost', port=6379, db=0)
    pubsub = r.pubsub()
    # Subscribe to both event and game channels
    pubsub.subscribe('new_event', 'new_game', 'new_game_with_room')
    return pubsub


async def handle_new_game_with_room(bot, message):
        print(message)
        payload = json.loads(message['data'].decode('utf-8'))

        # Now call the function with the correct parameters from the payload
        await sendApprovalMessageToAdminChannel(
            bot,
            payload["email"],
            None,
            payload["organizer"],
            payload["title"],         # Use "title" instead of "game_name"
            payload["description"],
            payload["players"],
            payload["start_time"],
            payload["end_time"],
            payload["halfPrivateRoom"],
            payload["firstLastName"],
            payload["privateRoomRequest"],
            payload['password'] if 'password' in payload else None,
        )
async def handle_new_event(bot, message):
    """
    Processes a Redis message from the 'new_event' channel, formats the event data
    into an embed, and sends it to the Discord events channel.
    """
    try:
        # The message data is expected to be JSON
        data = json.loads(message['data'].decode('utf-8'))
    except Exception as e:
        print("Error decoding Redis message (event):", e)
        return

    # Replace with your actual Events channel ID
    EVENTS_CHANNEL_ID = int(os.getenv("EVENTS_CHANNEL_ID"))
    channel = bot.get_channel(EVENTS_CHANNEL_ID)


    if channel is None:
        print("Events channel not found!")
        return

    embed = discord.Embed(
        title=data.get('title', 'No Title'),
        description=data.get('description', ''),
        color=discord.Color.blue()
    )

    #Format the times as EST 12hr for readability
    formattedStartTime = utcTo12hrEST(data.get('start_time', 'Unknown'))
    formattedEndTime = utcTo12hrEST(data.get('end_time', 'Unknown'))


    embed.add_field(name="Start Time", value=formattedStartTime, inline=False)
    embed.add_field(name="End Time", value=formattedEndTime, inline=False)
    embed.add_field(name="Price", value=data.get('price', 'Free'), inline=False)
    
    if data.get('game'):
        embed.add_field(name="Game", value=data.get('game'), inline=False)
    if data.get('participants'):
        embed.add_field(name="Participants", value=data.get('participants'), inline=False)

    #Add in the number of people going, setting to 1 since the organizer will be going
    embed.add_field(name="Number of Players Going", value=1, inline=False)
    
    #Add in the backend ID to the embed at the very end of the message
    embed.add_field(name="\u200b", value=(data.get('id', '')), inline=False)

    gamePosting = await channel.send(embed=embed)

    print(f'gamePosting type: {type(gamePosting)}')
    print(f'gamePosting: {gamePosting}')

    #Now add the interactions to the message
    await gamePosting.add_reaction("👍")
    await gamePosting.add_reaction("👎")


    # Need to calculate the number of seconds between the schedule date
    # and the end date and time for deletion

    #Grab the current time and localize it for EST and bring it to UTC
    #The 4 or 5 hour offset is already baked into the hours of UTC
    # Grab the current time to help get the seconds until the start of the 
    currentTime = (datetime.now(pytz.timezone("US/Eastern"))).astimezone(pytz.utc)

    #Grab end time of the game from EST 12 hour to UTC 24 hour
    endTime = est12hrTo24hrUTC(formattedEndTime)

    #Convert the end time into a datetime object
    endTime = datetime.fromisoformat(endTime)


    #Subtract the two to get the delta seconds left
    deleteTimeDifference = (endTime - currentTime).total_seconds()

    print(f"deleteTimeDifference: {deleteTimeDifference}")


    deleteJSON = {
        'id': data.get('id', '')
    }

    async def delete_ended_game():
        await asyncio.sleep(deleteTimeDifference)
        try:
            await gamePosting.delete()
            requests.delete("http://127.0.0.1:5000/games", json=deleteJSON)
        except:
            print("")
            #Not found, do nothing

    #Now schedule the deletion
    bot.loop.create_task(delete_ended_game())




async def handle_new_game(bot, message):
    """
    Processes a Redis message from the 'new_game' channel, formats the game data
    into an embed, and sends it to the Discord games channel.
    """
    print("Calling handle_new_game")
    try:
        data = json.loads(message['data'].decode('utf-8'))
    except Exception as e:
        print("Error decoding Redis message (game):", e)
        return

    # Replace with your actual Games channel ID
    GAMES_CHANNEL_ID = 1351970602856087582  
    channel = bot.get_channel(GAMES_CHANNEL_ID)
    if channel is None:
        print("Games channel not found!")
        return

    embed = discord.Embed(
        title=data.get('title', 'No Title'),
        description=data.get('description', ''),
        color=discord.Color.green()
    )

    #Format the times as EST 12hr for readability
    formattedStartTime = utcTo12hrEST(data.get('start_time', 'Unknown'))
    formattedEndTime = utcTo12hrEST(data.get('end_time', 'Unknown'))


    embed.add_field(name="Organizer", value=data.get('organizer', 'Unknown'), inline=False)
    embed.add_field(name="Start Time", value=formattedStartTime, inline=False)
    embed.add_field(name="End Time", value=formattedEndTime, inline=False)
    embed.add_field(name="Players", value=data.get('players', 'N/A'), inline=False)
    
    
    if data.get('participants'):
        embed.add_field(name="Participants", value=data.get('participants'), inline=False)
    if data.get('catalogue'):
        embed.add_field(name="Catalogue", value=data.get('catalogue'), inline=False)

    #Add in the number of people going, setting to 1 since the organizer will be going
    embed.add_field(name="Number Attending", value=1, inline=False)

    #Add in the backend ID to the embed at the very end of the message
    embed.add_field(name="\u200b", value=(data.get('id', '')), inline=False)
    
    gamePosting = await channel.send(embed=embed)
    



    print(f'gamePosting type: {type(gamePosting)}')
    print(f'gamePosting: {gamePosting}')

    #Now add the interactions to the message
    await gamePosting.add_reaction("👍")
    await gamePosting.add_reaction("👎")

    #Make the check to ensure only RSVP happens for users and not the bot
    #adding the initial reactions
    def gameRSVPCheck(reaction, user):
        return (
            reaction.message.id == gamePosting.id
            and user != bot.user
            and str(reaction.emoji) in ["👍", "👎"]
        )
    

    # Need to calculate the number of seconds between the schedule date
    # and the end date and time for deletion

    #Grab the current time and localize it for EST and bring it to UTC
    #The 4 or 5 hour offset is already baked into the hours of UTC
    # Grab the current time to help get the seconds until the start of the 
    currentTime = (datetime.now(pytz.timezone("US/Eastern"))).astimezone(pytz.utc)

    #Grab end time of the game from EST 12 hour to UTC 24 hour
    endTime = est12hrTo24hrUTC(formattedEndTime)

    #Convert the end time into a datetime object
    endTime = datetime.fromisoformat(endTime)


    #Subtract the two to get the delta seconds left
    deleteTimeDifference = (endTime - currentTime).total_seconds()

    print(f"deleteTimeDifference: {deleteTimeDifference}")


    deleteJSON = {
        'id': data.get('id', '')
    }

    async def delete_ended_game():
        await asyncio.sleep(deleteTimeDifference)
        try:
            await gamePosting.delete()
            requests.delete("http://127.0.0.1:5000/games", json=deleteJSON)
        except:
            print("")
            #Not found, do nothing

    #Now schedule the deletion
    bot.loop.create_task(delete_ended_game())


    



async def redis_listener(bot):
    """
    Listens on the Redis 'new_event' and 'new_game' channels for incoming announcements
    and processes them.
    """
    pubsub = redis_subscriber()
    loop = asyncio.get_event_loop()
    while True:
        # Run blocking get_message in an executor to avoid blocking the event loop.
        message = await loop.run_in_executor(None, pubsub.get_message, True, 1)
        if message and message['type'] == 'message':
            # Determine the channel of the message.
            channel_name = message['channel']
            if isinstance(channel_name, bytes):
                channel_name = channel_name.decode('utf-8')
            if channel_name == 'new_event':
                await handle_new_event(bot, message)
            elif channel_name == 'new_game_with_room':
                await handle_new_game_with_room(bot, message)
            elif channel_name == 'new_game':
                await handle_new_game(bot, message)
        await asyncio.sleep(5)  # Increase sleep if precision is not critical

#Returns in format mm-dd-yyy hh:mm am/pm
def utcTo12hrEST(utcString):
    print("Converting utc to 12 hr EST")
    #Date conversions from UTC to EST

    # #1. Make the datetime object from the game date
    utcDateTimeObject = datetime.fromisoformat(utcString)

    # #Convert to EST
    estDateTimeObject = utcDateTimeObject.astimezone(pytz.timezone("US/Eastern"))

    # #Format the date and time to 12 hr
    estDateTimeObject = estDateTimeObject.strftime("%m-%d-%Y %I:%M %p")

    return estDateTimeObject


def est12hrTo24hrUTC(estString):
    print("Converting the est 12hr time to 24hr UTC")

    #1.) Make the string into a datetime object
    estTimeObject = datetime.strptime(estString, "%m-%d-%Y %I:%M %p")

    #2.) Set the objects timezone as EST to ensure proper converting
    estTimeObject = (pytz.timezone("US/Eastern")).localize(estTimeObject)

    #3.) Now convert it to UTC
    utcTimeObject = estTimeObject.astimezone(pytz.utc)

    print(f"utcTimeObject: {utcTimeObject}")

    #4.) Return the string of the UTC format
    return utcTimeObject.isoformat()


async def rsvpToGame(currentAttendingString, maxPlayersString, reaction, message, user, embed, embedCopy):
    #Will convert the string over to a int and return
    #Used for the attending max comparison
    
    #Convert the two
    maxPlayersInt = int(maxPlayersString)
    numberAttendingInt = int(currentAttendingString)


    #Converstion of maxPlayersString into an int
    print(f"rsvpToGame, int(maxPlayersString): should be {maxPlayersString}(type: {type(maxPlayersString)}), but is {maxPlayersInt} (type: {type(maxPlayersInt)})")
    print(f"rsvpToGame, int(currentAttending): should be {currentAttendingString}(type: {type(currentAttendingString)}), but is {numberAttendingInt} (type: {type(numberAttendingInt)})")


    if str(reaction.emoji) == '👍':#Now check if there is enough slots left to join
            if maxPlayersInt < (numberAttendingInt + 1):
                print(f"rsvpToGame, maxPlayersInt < (numberAttendingInt + 1): {maxPlayersInt} < {numberAttendingInt + 1}")

                #the max players has already been hit, dont RSVP
                #Remove the 👍 reaction
                await message.remove_reaction('👍', user)

                #Now send an ephemeral message saying the game they RSVPd to is full
                #await reaction.response.send_message(content="Can not RSVP to the following game, it is already full", embed=embed, ephemeral=True)

                #Now send an dm saying the game they RSVPd to is full
                await user.send(content="Can not RSVP to the following game, it is already full", embed=embed);

                #Return on this function as it is done
                return
            else:

                #The player can be accommodated, now add 1 to the attending field
                numberAttendingInt = numberAttendingInt + 1
                print(f"rsvpToGame: numberAttendingInt = numberAttendingInt + 1 : {numberAttendingInt}")


                #Iterate through the copy and modify the Number Attending field with new value
                #The embed copy was declared above
                for field in embed.fields:
                    print(f"{field.name}: {field.value}")
                    if field.name == "Number Attending":
                        embedCopy.add_field(name=field.name, value=numberAttendingInt, inline=field.inline)
                    else:
                        embedCopy.add_field(name=field.name, value=field.value, inline=field.inline)

                print("-----embedCopy----")
                for field in embedCopy.fields:
                    print(f"{field.name}: {field.value}")

                #Now update the message with the new embed
                await message.edit(embed=embedCopy)


async def removeRSVPToGame(numberAttendingSting, reaction, message, embed, embedCopy, wasRSVPd):
    print(f"removeRSVPToGame, wasRSVPD: {wasRSVPd}")

    #Inital check to ensure there was a previous RSVP to then decrement off the going counter
    if not wasRSVPd:
        return


    #Convert the two
    numberAttendingInt = int(numberAttendingSting)


    #Conversion of maxPlayersString into an int
    
    print(f"removeRSVPToGame, int(numberAttendingSting): should be {numberAttendingSting}(type: {type(numberAttendingSting)}), but is {numberAttendingInt} (type: {type(numberAttendingInt)})")

    #The player can be accommodated, now subtract 1 to the attending field, don't go lower than 1,
    if (numberAttendingInt - 1) >= 1:
        print(f"removeRSVPToGame, (numberAttendingInt - 1) >= 1: {numberAttendingInt - 1} >= 1")

        #No need to ensure the value is min 1, the check has happened
        numberAttendingInt = numberAttendingInt - 1
        print(f"removeRSVPToGame, numberAttendingInt - 1: {numberAttendingInt} ")
    elif (numberAttendingInt - 1) < 1:
        print(f"removeRSVPToGame, (numberAttendingInt - 1) < 1: {numberAttendingInt - 1} < 1")
        

        #Host has to be rsvp'd, also should catch the failed conversion
        numberAttendingInt = 1

    #Iterate through the copy and modify the Number Attending field with new value
    for field in embed.fields:
        print(f"{field.name}: {field.value}")
        if field.name == "Number Attending":
            embedCopy.add_field(name=field.name, value=numberAttendingInt, inline=field.inline)
        else:
            embedCopy.add_field(name=field.name, value=field.value, inline=field.inline)


    #Now update the message with the new embed
    await message.edit(embed=embedCopy)


    

    

def main():
    bot = asyncio.run(run_bot())
    bot.run(os.getenv("DISCORD_TOKEN"))

if __name__ == "__main__":
    main()








