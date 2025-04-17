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

    bot = commands.Bot(command_prefix="/", intents=intents)

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
    EVENTS_CHANNEL_ID = 1352001770393571430
    channel = bot.get_channel(EVENTS_CHANNEL_ID)
    if channel is None:
        print("Events channel not found!")
        return

    # Custom Bot & Bevy color - dark red that matches your website
    BOT_AND_BEVY_COLOR = discord.Color.from_rgb(148, 46, 42)  # #942E2A
    
    with open("../Website/public/b&b_crest.png", "rb") as f:
        crest_image = discord.File(f, filename="bb_crest.png")

    # Create a more styled embed
    embed = discord.Embed(
        title=f"📅 **{data.get('title', 'New Event')}**",
        description=f"{data.get('description', 'Join us for this exciting event!')}",
        color=BOT_AND_BEVY_COLOR,
    )
    
    # Add an author field for context
    embed.set_author(
        name="Bot & Bevy Event Announcement", 
        icon_url="attachment://bb_crest.png"  # Your logo
    )
    
    # Add image if available, otherwise use a default event image
    if data.get('image'):
        embed.set_thumbnail(url=data.get('image'))
    else:
        embed.set_thumbnail(url="attachment://bb_crest.png")
    
    # Format date and time for better readability
    start_time = data.get('start_time', 'TBA')
    end_time = data.get('end_time', 'TBA')

    # Add fields with improved formatting (some inline, some not)
    embed.add_field(name="📆 Date & Time", value=f"**Start:** {start_time}\n**End:** {end_time}", inline=False)
    embed.add_field(name="💰 Price", value=data.get('price', 'Free'), inline=True)
    
    if data.get('game'):
        embed.add_field(name="🎲 Game", value=data.get('game'), inline=True)
    if data.get('participants'):
        embed.add_field(name="👥 Participants", value=data.get('participants'), inline=False)
    
    # Set timestamp for the event (if you can parse the date string)
    # This would show the time in each user's local timezone
    # embed.timestamp = datetime.datetime.strptime(start_time, '%Y-%m-%d %I:%M %p')
    
    await channel.send(file=crest_image, embed=embed)

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

    # Bot & Bevy green
    GAME_COLOR = discord.Color.from_rgb(87, 107, 30)   #576b1e
    
    with open("../Website/public/b&b_crest.png", "rb") as f:
        crest_image = discord.File(f, filename="bb_crest.png")

    embed = discord.Embed(
        title=f"🎲 **{data.get('title', 'Game Session')}**",
        description=f"{data.get('description', 'Join us for this game session!')}",
        color=GAME_COLOR,
    )
    
    
    embed.set_author(
        name="Bot & Bevy Game Session", 
        icon_url="attachment://bb_crest.png"
    )
    

    if data.get('image'):
        embed.set_thumbnail(url=data.get('image'))
    else:
        embed.set_thumbnail(url="attachment://bb_crest.png")
    
    # Format date and time for better readability
    start_time = data.get('start_time', 'TBA')
    end_time = data.get('end_time', 'TBA')

    # added fields with improved formatting 
    embed.add_field(name="📆 Date & Time", value=f"**Start:** {start_time}\n**End:** {end_time}", inline=False)
    embed.add_field(name="👤 Organizer", value=data.get('organizer', 'Bot & Bevy Staff'), inline=True)
    
    if data.get('players'):
        embed.add_field(name="👥 Players Needed", value=data.get('players', 'N/A'), inline=True)
    
    if data.get('participants'):
        embed.add_field(name="🧩 Current Players", value=data.get('participants'), inline=False)
    
    if data.get('catalogue'):
        embed.add_field(name="📚 Game Type", value=data.get('catalogue'), inline=True)
    
    await channel.send(file=crest_image, embed=embed)
    
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

def main():
    bot = asyncio.run(run_bot())
    bot.run(os.getenv("DISCORD_TOKEN"))

if __name__ == "__main__":
    main()
