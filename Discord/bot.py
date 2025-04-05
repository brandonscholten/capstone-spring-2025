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
import asyncio
import redis
import json
from datetime import datetime
import pytz

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
        print("Handling reaction adds!!!!!!")

        if user.bot:
            #Don't handle the reactions from the bot, only users
            return

        #Grabs the game/event message and chanel the RSVP is done in
        #Ensures this only fires for the specific channels and messages
        message = reaction.message
        channel = message.channel

        #Grabs the channel ID from the env file to ensure proper channel for reaction handling
        GAMES_CHANNEL_ID = int(os.getenv("GAMES_CHANNEL_ID"))
        EVENTS_CHANNEL_ID = int(os.getenv("EVENTS_CHANNEL_ID"))

        if channel.id not in {GAMES_CHANNEL_ID, EVENTS_CHANNEL_ID} :
            #Reaction was not in the games channel, so dont do anything
            return
        
        #Now iterate through the reactions and remove only the
        #user that changed their RVSP status (reaction)
        for reactions in message.reactions:
            #Check if the new reaction (parameter) is not equal=
            #to the reaction found, remove it
            if reactions.emoji != reaction.emoji:
                #Remove it
                users = [u async for u in reactions.users()]
                if user in users:
                    await reactions.remove(user)

        #
        #   Handle reaction addition
        #
        if str(reaction.emoji) == '👍':
            print("RSVPing for the event")

            #Check for any other reaction and remove it (👎)
            
##################################################################################################
            
            #Make the JSON

            #Make the API call to add to the RSVP

            #
            # Schedule the reminder!

            #
            #Grab the event time from message
            #

            #Grab the embedded message
            embeddedMessage = message.embeds[0]

            #Make a default value for the startTime
            startTime = None

            #Go through the fields and find the correct field of start time
            for field in embeddedMessage.fields:
              if field.name == "Start Time":
                  startTime = field.value
                  break

            
            
            # Convert the start time from 12hr EST to 24hr UTC
            startTime = est12hrTo24hrUTC(startTime)


            # Convert the startTime into a datetime object
            startTime = datetime.fromisoformat(startTime)

            # ^^ WORKING CODE ABOVE THIS LINE ^^

            # Grab the seconds from startTime
            startTime = startTime.total_seconds()

            print(f"Start time seconds: {startTime}")

            # Grab the current time to help get the seconds until the start of the 
            # currentTime = datetime.now(pytz.timezone("US/Eastern")).total_seconds()


            # reminder_time = startTime - timedelta(hours=1)
            # delay = (reminder_time - currentTime)
            #
            # if delay > 0:
            #    async def send_dm_reminder():
            #       await asyncio.sleep(delay)
            #       print(f'{message.content}')
            #       await user.send("Your game is starting soon!", embed=message.embeds[0])
            #
            # task = bot.loop.create_task(send_dm_reminder())  # ✅ This is the scheduling
            # scheduled_reminders[(user.id, message.id)] = task  # Store task to cancel later

####################################################################################################

        elif str(reaction.emoji) == '👎':
            print("Not RSVping, or removing RSVP for the event")

            #Check if a previous 👍 was put in, if so switch it to a 👎

            #Unschedule the reminder


            #Make the JSON

            #Make the API call to remove the RSVP


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
    pubsub.subscribe('new_event', 'new_game')
    return pubsub

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
    
    gamePosting = await channel.send(embed=embed)

    print(f'gamePosting type: {type(gamePosting)}')
    print(f'gamePosting: {gamePosting}')

    #Now add the interactions to the message
    await gamePosting.add_reaction("👍")
    await gamePosting.add_reaction("👎")




async def handle_new_game(bot, message):
    """
    Processes a Redis message from the 'new_game' channel, formats the game data
    into an embed, and sends it to the Discord games channel.
    """
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
    

def main():
    bot = asyncio.run(run_bot())
    bot.run(os.getenv("DISCORD_TOKEN"))

if __name__ == "__main__":
    main()








