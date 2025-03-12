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
    @app_commands.describe(event_date="date of the event (format: mm/dd/yyy)")
    @app_commands.describe(event_time="date of the event (format: HH:MM AM/PM)")
    async def createEvent(self, interaction: discord.Interaction, event_name: str, event_date: typing.Optional[str], event_time: typing.Optional[str]):
        usersID = interaction.user.id
        usersName = interaction.user.name
        privateRoomRequest = False
        event_date = event_date
        event_time = event_time

        print(event_time)

        #await interaction.response.pong()
        

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
                #await thread.send("If you would like to book the backroom for this event, please visit one of the two links below:\n HALF ROOM \n FULL ROOM")
                privateRoomRequest = True
            elif str(reaction.emoji) == "👎":
                privateRoomRequest = False
        except TimeoutError:
            await thread.send("Time out awaiting for a reaction, please try again")
        
        await interaction.followup.send("Thank you for scheduling your event, the thread is now locked!")

        await thread.edit(archived=True, locked=True)


        #
        #  DM for event approval
        #

        #We need to DM Coty with the request, so take it here and send him a DM with all the event details!
        #TODO: REPLACE THE USER KEY IT PULLS WITH COTY'S, CURRENTLY USING A TEST ONE (MINE, ELLIOTT'S)
        eventApprovalUser = await self.bot.fetch_user(os.getenv("TEST_DISCORD_USER_ID"))

        #Build the DM message for approvals:
        approvalMesage = f' The user {usersName} is requesting the following game, details are below\n'
        #approvalMessage += f'* Event Name: {event_name}'

        approvalMesage += f'* Private Room Requested?: {privateRoomRequest}'

        eventApprovalMessage = await eventApprovalUser.send(approvalMesage)

        #Now add the interactions to the event
        await eventApprovalMessage.add_reaction('👍')
        await eventApprovalMessage.add_reaction('👎')


        #Make a function to handle a check to ensure the correct DM id is used for interaction

    #@app_commands.command()
    #async def 
        

    




async def setup(bot):
    await bot.add_cog(Messages(bot))
