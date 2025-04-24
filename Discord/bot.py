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
import re
import io
import base64

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

    # Add the RSVP reaction removal of 👍 only!
    @bot.event
    async def on_reaction_remove(reaction, user):
        # Ensures the bot's reaction removal does not activate this
        if user.bot:
            return
        
        GAMES_CHANNEL_ID = int(os.getenv("GAMES_CHANNEL_ID"))
        EVENTS_CHANNEL_ID = int(os.getenv("EVENTS_CHANNEL_ID"))

        message = reaction.message
        channel = message.channel

        if channel.id not in {GAMES_CHANNEL_ID, EVENTS_CHANNEL_ID}:
            return
        
        if str(reaction.emoji) != '👍':
            return

        user_has_other_reaction = False
        for react in message.reactions:
            if react.emoji != '👍':
                users = [u async for u in react.users()]
                if user in users:
                    user_has_other_reaction = True
                    break

        embed = message.embeds[0]
        gameEventType = "game" if channel.id == GAMES_CHANNEL_ID else "event"

        # Prepare embedCopy
        if gameEventType == "game":
            GAME_COLOR = discord.Color.from_rgb(87, 107, 30)
            with open("../Website/public/b&b_crest.png", "rb") as f:
                crest_image = discord.File(f, filename="bb_crest.png")
            embedCopy = discord.Embed(
                title=f"**{embed.title}**",
                description=embed.description,
                color=GAME_COLOR,
            )
            embedCopy.set_author(name="Bot & Bevy Game Session", icon_url="attachment://bb_crest.png")
            thumb_url = embed.thumbnail.url or "attachment://bb_crest.png"
            embedCopy.set_thumbnail(url=thumb_url)
        else:
            BOT_AND_BEVY_COLOR = discord.Color.from_rgb(148, 46, 42)
            with open("../Website/public/b&b_crest.png", "rb") as f:
                crest_image = discord.File(f, filename="bb_crest.png")
            embedCopy = discord.Embed(
                title=f"**{embed.title}**",
                description=embed.description,
                color=BOT_AND_BEVY_COLOR,
            )
            embedCopy.set_author(name="Bot & Bevy Event Announcement", icon_url="attachment://bb_crest.png")
            thumb_url = embed.thumbnail.url or "attachment://bb_crest.png"
            embedCopy.set_thumbnail(url=thumb_url)

        if not user_has_other_reaction:
            numberAttending = next((f.value for f in embed.fields if f.name == "Number Attending"), None)
            if gameEventType == 'game':
                await removeRSVPToGame(numberAttending, reaction, message, embed, embedCopy, True)

            # Unschedule the reminder
            gameID = next((f.value for f in embed.fields if f.name == "\u200b"), None)

            participantRemoveJSON = {
                "type": gameEventType,
                "participant": str(user.id),
                "id": gameID
            }
            requests.post("http://127.0.0.1:5000/participants/remove", json=participantRemoveJSON)

    @bot.event
    async def on_reaction_add(reaction, user):
        if user.bot:
            return

        message = reaction.message
        channel = message.channel
        GAMES_CHANNEL_ID = int(os.getenv("GAMES_CHANNEL_ID"))
        EVENTS_CHANNEL_ID = int(os.getenv("EVENTS_CHANNEL_ID"))

        if channel.id not in {GAMES_CHANNEL_ID, EVENTS_CHANNEL_ID}:
            return

        gameEventType = "game" if channel.id == GAMES_CHANNEL_ID else "event"
        previouslyRSVPd = False

        # Remove opposite reactions if user had them
        for reactions in message.reactions:
            if reactions.emoji != reaction.emoji:
                users = [u async for u in reactions.users()]
                if user in users:
                    if str(reaction.emoji) == '👎' and str(reactions.emoji) == '👍':
                        previouslyRSVPd = True
                    await reactions.remove(user)

        embed = message.embeds[0]

        # Prepare embedCopy
        if gameEventType == "game":
            GAME_COLOR = discord.Color.from_rgb(87, 107, 30)
            with open("../Website/public/b&b_crest.png", "rb") as f:
                crest_image = discord.File(f, filename="bb_crest.png")
            embedCopy = discord.Embed(
                title=f"**{embed.title}**",
                description=embed.description,
                color=GAME_COLOR,
            )
            embedCopy.set_author(name="Bot & Bevy Game Session", icon_url="attachment://bb_crest.png")
            thumb_url = embed.thumbnail.url or "attachment://bb_crest.png"
            embedCopy.set_thumbnail(url=thumb_url)
        else:
            BOT_AND_BEVY_COLOR = discord.Color.from_rgb(148, 46, 42)
            with open("../Website/public/b&b_crest.png", "rb") as f:
                crest_image = discord.File(f, filename="bb_crest.png")
            embedCopy = discord.Embed(
                title=f"**{embed.title}**",
                description=embed.description,
                color=BOT_AND_BEVY_COLOR,
            )
            embedCopy.set_author(name="Bot & Bevy Event Announcement", icon_url="attachment://bb_crest.png")
            thumb_url = embed.thumbnail.url or "attachment://bb_crest.png"
            embedCopy.set_thumbnail(url=thumb_url)

        if str(reaction.emoji) == '👍':
            # Add participant via API
            gameID = next((f.value for f in embed.fields if f.name == "\u200b"), None)
            response = requests.post(
                "http://127.0.0.1:5000/participants/add",
                json={"type": gameEventType, "participant": user.id, "id": gameID}
            )

            # Extract times & counts
            start_field = next(f.value for f in embed.fields if f.name == "📆 Date & Time")
            match = re.search(r"\*\*Start:\*\*\s*(.+?)\n", start_field)
            start_time = match.group(1) if match else None
            maxPlayers = next((f.value for f in embed.fields if f.name == "👥 Players Needed"), None)
            numberAttending = next((f.value for f in embed.fields if f.name == "Number Attending"), None)

            if gameEventType == 'game':
                await rsvpToGame(numberAttending, maxPlayers, reaction, message, user, embed, embedCopy)

            # Schedule DM reminder
            utc_start = est12hrTo24hrUTC(start_time)
            dt_start = datetime.fromisoformat(utc_start)
            now_utc = datetime.now(pytz.timezone("US/Eastern")).astimezone(pytz.utc)
            delay = (dt_start - timedelta(hours=1) - now_utc).total_seconds()

            async def send_dm_reminder(msg):
                await asyncio.sleep(delay)
                thumbs_up = next((r for r in msg.reactions if str(r.emoji)=='👍'), None)
                if thumbs_up:
                    users = await thumbs_up.users().flatten()
                    if user in users:
                        await user.send("Your game is starting soon!", embed=msg.embeds[0])

            if delay > 0:
                bot.loop.create_task(send_dm_reminder(message))
            else:
                await user.send("Your game starts in under an hour", embed=message.embeds[0])

        elif str(reaction.emoji) == '👎':
            if gameEventType == 'game':
                numberAttending = next((f.value for f in embed.fields if f.name == "Number Attending"), None)
                await removeRSVPToGame(numberAttending, reaction, message, embed, embedCopy, previouslyRSVPd)
            gameID = next((f.value for f in embed.fields if f.name == "\u200b"), None)
            requests.post(
                "http://127.0.0.1:5000/participants/remove",
                json={"type": gameEventType, "participant": str(user.id), "id": gameID}
            )

    @bot.event
    async def on_ready():
        print("Bot is getting ready")
        await bot.tree.sync()
        print("Bot is ready")
        bot.loop.create_task(redis_listener(bot))

    await load_cogs(bot)
    return bot

def redis_subscriber():
    r = redis.Redis(host='localhost', port=6379, db=0)
    pubsub = r.pubsub()
    pubsub.subscribe('new_event', 'new_game', 'new_game_with_room')
    return pubsub

async def handle_new_game_with_room(bot, message):
    payload = json.loads(message['data'].decode('utf-8'))
    await sendApprovalMessageToAdminChannel(
        bot,
        payload["email"],
        None,
        payload["organizer"],
        payload["title"],
        payload["description"],
        payload["players"],
        payload["start_time"],
        payload["end_time"],
        payload["halfPrivateRoom"],
        payload["firstLastName"],
        payload["privateRoomRequest"],
        payload.get('password')
    )

async def handle_new_event(bot, message):
    data = json.loads(message['data'].decode('utf-8'))
    channel = bot.get_channel(int(os.getenv("EVENTS_CHANNEL_ID")))
    if channel is None:
        print("Events channel not found!")
        return

    BOT_AND_BEVY_COLOR = discord.Color.from_rgb(148, 46, 42)

    embed = discord.Embed(
        title=f"📅 **{data.get('title', 'New Event')}**",
        description=data.get('description', 'Join us for this exciting event!'),
        color=BOT_AND_BEVY_COLOR,
    )
    embed.set_author(
        name="Bot & Bevy Event Announcement",
        icon_url="attachment://crest.png"
    )

    # Handle Base64 image vs fallback crest
    if image_b64 := data.get("image"):
        try:
            image_bytes = base64.b64decode(image_b64)
            file = discord.File(io.BytesIO(image_bytes), filename="event.png")
            embed.set_thumbnail(url="attachment://event.png")
        except Exception as e:
            print("Image processing failed:", e)
            # Fallback to crest
            file = discord.File("../Website/public/b&b_crest.png", filename="crest.png")
            embed.set_thumbnail(url="attachment://crest.png")
    else:
        file = discord.File("../Website/public/b&b_crest.png", filename="crest.png")
        embed.set_thumbnail(url="attachment://crest.png")

    # Format time fields
    start_time = data.get('start_time', 'TBA')
    end_time   = data.get('end_time', 'TBA')
    if start_time != 'TBA':
        start_time = utcTo12hrEST(start_time)
    if end_time != 'TBA':
        end_time = utcTo12hrEST(end_time)

    embed.add_field(name="📆 Date & Time",
                    value=f"**Start:** {start_time}\n**End:** {end_time}",
                    inline=False)
    embed.add_field(name="💰 Price", value=data.get('price', 'Free'), inline=True)
    if game := data.get('game'):
        embed.add_field(name="🎲 Game", value=game, inline=True)
    if participants := data.get('participants'):
        embed.add_field(name="👥 Participants", value=participants, inline=False)
    embed.add_field(name="Number of Players Going", value=1, inline=False)
    embed.add_field(name="\u200b", value=data.get('id', ''), inline=False)

    # Send and react
    msg = await channel.send(file=file, embed=embed)
    await msg.add_reaction("👍")
    await msg.add_reaction("👎")

    # Schedule deletion
    current_utc = datetime.now(pytz.timezone("US/Eastern")).astimezone(pytz.utc)
    end_iso = est12hrTo24hrUTC(end_time)
    delete_dt = datetime.fromisoformat(end_iso)
    delay = (delete_dt - current_utc).total_seconds()

    async def delete_ended_game():
        await asyncio.sleep(delay)
        try:
            await msg.delete()
            requests.delete("http://127.0.0.1:5000/games", json={'id': data.get('id', '')})
        except:
            pass

    bot.loop.create_task(delete_ended_game())

async def handle_new_game(bot, message):
    data = json.loads(message['data'].decode('utf-8'))
    GAMES_CHANNEL_ID = 1351970602856087582
    channel = bot.get_channel(GAMES_CHANNEL_ID)
    if channel is None:
        print("Games channel not found!")
        return

    GAME_COLOR = discord.Color.from_rgb(87, 107, 30)

    start_time = data.get('start_time', 'TBA')
    end_time   = data.get('end_time', 'TBA')
    if start_time != 'TBA':
        start_time = utcTo12hrEST(start_time)
    if end_time != 'TBA':
        end_time = utcTo12hrEST(end_time)

    embed = discord.Embed(
        title=f"🎲 **{data.get('title', 'Game Session')}**",
        description=data.get('description', 'Join us for this game session!'),
        color=GAME_COLOR,
    )
    embed.set_author(name="Bot & Bevy Game Session", icon_url="attachment://bb_crest.png")
    if img := data.get('image'):
        embed.set_thumbnail(url=img)
        file = None
    else:
        file = discord.File("../Website/public/b&b_crest.png", filename="bb_crest.png")
        embed.set_thumbnail(url="attachment://bb_crest.png")

    embed.add_field(name="📆 Date & Time",
                    value=f"**Start:** {start_time}\n**End:** {end_time}",
                    inline=False)
    embed.add_field(name="👤 Organizer", value=data.get('organizer', 'Bot & Bevy Staff'), inline=True)
    if players := data.get('players'):
        embed.add_field(name="👥 Players Needed", value=players, inline=True)
    if parts := data.get('participants'):
        embed.add_field(name="🧩 Current Players", value=parts, inline=False)
    if cat := data.get('catalogue'):
        embed.add_field(name="📚 Game Type", value=cat, inline=True)
    embed.add_field(name="Number Attending", value=1, inline=False)
    embed.add_field(name="\u200b", value=data.get('id', ''), inline=False)

    msg = await channel.send(file=file, embed=embed) if file else await channel.send(embed=embed)
    await msg.add_reaction("👍")
    await msg.add_reaction("👎")

    # Schedule deletion
    current_utc = datetime.now(pytz.timezone("US/Eastern")).astimezone(pytz.utc)
    delete_iso = est12hrTo24hrUTC(end_time)
    delete_dt = datetime.fromisoformat(delete_iso)
    delay = (delete_dt - current_utc).total_seconds()

    async def delete_ended_game():
        await asyncio.sleep(delay)
        try:
            await msg.delete()
            requests.delete("http://127.0.0.1:5000/games", json={'id': data.get('id', '')})
        except:
            pass

    bot.loop.create_task(delete_ended_game())

async def redis_listener(bot):
    pubsub = redis_subscriber()
    loop = asyncio.get_event_loop()
    while True:
        message = await loop.run_in_executor(None, pubsub.get_message, True, 1)
        if message and message['type'] == 'message':
            channel_name = message['channel']
            if isinstance(channel_name, bytes):
                channel_name = channel_name.decode('utf-8')
            if channel_name == 'new_event':
                await handle_new_event(bot, message)
            elif channel_name == 'new_game_with_room':
                await handle_new_game_with_room(bot, message)
            elif channel_name == 'new_game':
                await handle_new_game(bot, message)
        await asyncio.sleep(5)

def utcTo12hrEST(utcString):
    utc_dt = datetime.fromisoformat(utcString)
    est_dt = utc_dt.astimezone(pytz.timezone("US/Eastern"))
    return est_dt.strftime("%m-%d-%Y %I:%M %p")

def est12hrTo24hrUTC(estString):
    est_obj = datetime.strptime(estString, "%m-%d-%Y %I:%M %p")
    est_loc = pytz.timezone("US/Eastern").localize(est_obj)
    utc_obj = est_loc.astimezone(pytz.utc)
    return utc_obj.isoformat()

async def rsvpToGame(currentAttendingString, maxPlayersString, reaction, message, user, embed, embedCopy):
    maxPlayersInt = int(maxPlayersString)
    numberAttendingInt = int(currentAttendingString)
    if str(reaction.emoji) == '👍':
        if maxPlayersInt < (numberAttendingInt + 1):
            await message.remove_reaction('👍', user)
            await user.send(content="Cannot RSVP: game is already full", embed=embed)
            return
        numberAttendingInt += 1
        for field in embed.fields:
            if field.name == "Number Attending":
                embedCopy.add_field(name=field.name, value=numberAttendingInt, inline=field.inline)
            else:
                embedCopy.add_field(name=field.name, value=field.value, inline=field.inline)
        await message.edit(embed=embedCopy)

async def removeRSVPToGame(numberAttendingString, reaction, message, embed, embedCopy, wasRSVPd):
    if not wasRSVPd:
        return
    numberAttendingInt = int(numberAttendingString)
    numberAttendingInt = max(1, numberAttendingInt - 1)
    for field in embed.fields:
        if field.name == "Number Attending":
            embedCopy.add_field(name=field.name, value=numberAttendingInt, inline=field.inline)
        else:
            embedCopy.add_field(name=field.name, value=field.value, inline=field.inline)
    await message.edit(embed=embedCopy)

def main():
    bot = asyncio.run(run_bot())
    bot.run(os.getenv("DISCORD_TOKEN"))

if __name__ == "__main__":
    main()
