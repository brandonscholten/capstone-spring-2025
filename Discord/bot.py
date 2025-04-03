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
            payload["privateRoomRequest"]
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
    EVENTS_CHANNEL_ID = 1352001770393571430
    channel = bot.get_channel(EVENTS_CHANNEL_ID)
    if channel is None:
        print("Events channel not found!")
        return

    embed = discord.Embed(
        title=data.get('title', 'No Title'),
        description=data.get('description', ''),
        color=discord.Color.blue()
    )
    embed.add_field(name="Start Time", value=data.get('start_time', 'Unknown'), inline=False)
    embed.add_field(name="End Time", value=data.get('end_time', 'Unknown'), inline=False)
    embed.add_field(name="Price", value=data.get('price', 'Free'), inline=False)
    
    if data.get('game'):
        embed.add_field(name="Game", value=data.get('game'), inline=False)
    if data.get('participants'):
        embed.add_field(name="Participants", value=data.get('participants'), inline=False)
    
    await channel.send(embed=embed)

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
    embed.add_field(name="Organizer", value=data.get('organizer', 'Unknown'), inline=False)
    embed.add_field(name="Start Time", value=data.get('start_time', 'Unknown'), inline=False)
    embed.add_field(name="End Time", value=data.get('end_time', 'Unknown'), inline=False)
    embed.add_field(name="Players", value=data.get('players', 'N/A'), inline=False)
    
    if data.get('participants'):
        embed.add_field(name="Participants", value=data.get('participants'), inline=False)
    if data.get('catalogue'):
        embed.add_field(name="Catalogue", value=data.get('catalogue'), inline=False)
    
    await channel.send(embed=embed)
    


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


def main():
    bot = asyncio.run(run_bot())
    bot.run(os.getenv("DISCORD_TOKEN"))

if __name__ == "__main__":
    main()








