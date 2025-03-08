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

class Messages(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="list_events", description="Creates an event and allows users to RSVP")
    async def listevents(self, interaction: discord.Interaction):
       #Temp list to hold items to list out the events


        return

    @app_commands.command(name="list_games", description="Lists the current game collection of Board & Bevy")
    async def listGames(self, interaction: discord.Interaction):

        #Call API HERE and collect titles!
        games = requests.get("http://127.0.0.1:5000/catalogue/titles")

        #games = requests.post("http://127.0.0.1:5000/catalogue/search", json="{title: 'T'}")

        games = games.json()


        print(games)

        gameString = f''

        #Go through the games and add them as bullet points
        for game in games:
            print(type(game))
            gameString += f'\n * {game["title"]}'


        #Send the games back in an message
        await interaction.response.send_message(gameString)
    
    
    
    @app_commands.command(name="create_event", description="Creates an event and allows users to RSVP")
    @app_commands.describe(event_name="the name of the event")
    async def createEvent(self, interaction: discord.Interaction, event_name: str):
        usersID = interaction.user.id

        await interaction.response.pong()
        

        #Send a message to create a thread on (have to without the server being Nitro boosted)
        threadStarter = (await interaction.response.send_message("Creating a thread to schedule, please open the thread to continue (The thread will be locked after)")).resource

        #
        #   Thread creation
        #
        thread = await threadStarter.create_thread(name="Test Thread")

        #Ask if the person would like to book the private room for the event?
        privateRoomWanted = await thread.send("Would you like to book a private room for the event (Can do half and full room)? \n\n 👍 - Yes \n\n 👎- No ")

        #Grab the message to then add the valid reactions to make it easier on the user
        # = await interaction.original_response()

        #Adds in the options for valid reactions
        await privateRoomWanted.add_reaction("👍")
        await privateRoomWanted.add_reaction("👎")

        #Await for the user to react to the message
        try:
            reaction, user = await self.bot.wait_for('reaction_add', timeout=60)
            if str(reaction.emoji) == "👍":
                await thread.send("If you would like to book the backroom for this event, please visit one of the two links below:\n HALF ROOM \n FULL ROOM")
            #elif str(reaction.emoji) == "👎":
                #do nothing or still deciding on what to do
        except TimeoutError:
            await thread.send("Time out awaiting for a reaction, please try again")
        
        await interaction.followup.send("Thank you for scheduling your event, the thread is now locked!")

        await thread.edit(archived=True, locked=True)

    #@app_commands.command()
    #async def 
        

    




async def setup(bot):
    await bot.add_cog(Messages(bot))
