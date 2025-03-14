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
    
    
    
    @app_commands.command(name="create_game", description="Creates an game and allows users to RSVP")
    @app_commands.describe(game_name="the name of the game")
    @app_commands.describe(game_date="date of the game (format: mm/dd/yyy)")
    @app_commands.describe(game_time="date of the game (format: HH:MM AM/PM)")
    async def createGame(self, interaction: discord.Interaction, game_name: typing.Optional[str], game_date: typing.Optional[str], game_time: typing.Optional[str]):
        usersID = interaction.user.id
        usersName = interaction.user.name
        usersObject = await self.bot.fetch_user(usersID)
        privateRoomRequest = False
        game_date = game_date
        game_time = game_time
        game_name = game_name
        game_description = None

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
            except TimeoutError:
                thread.send("Timeout reached, please try creating an game again")


        #
        #Collect the game description
        #
        try:
            gameDescription = await self.bot.wait_for('message', timeout=120)
            game_description = gameDescription
        except TimeoutError:
            thread.send()


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
        approvalMessage += f'* Event Name: {game_name.content}\n'

        approvalMessage += f'* Private Room Requested?: {privateRoomRequest}'

        gameApprovalMessage = await gameApprovalChanel.send(approvalMessage)

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
               print("Thumbs down!!!")

               optionalDenyMessagePrompt = await gameApprovalMessage.reply("Would you like to send a reason for denying the event?")

               #Add the reactions
               optionalDenyMessagePrompt.add_reaction("👍")
               optionalDenyMessagePrompt.add_reaction("👎")

               try:
                   denyMessageReasonReaction, user = self.bot.wait_for("reaction_add")

                   if str(denyMessageReason.emoji) == '👍':
                       #Collect the reason
                       optionalDenyMessagePrompt.reply("Please send your reason")

                       #try:
               except:
                   print("ERROR")           
               
               denyMessageReason = "This will hold the reason for denial"

               #Now print a follow-up message, asking for an optional reason

               denialMessage = "Your request has been **denied**"

               if denyMessageReason != None:
                 #There is a deny message, then append it to the string
                 denialMessage += f', please find the reason below \n{denyMessageReason}'
                
               #Now send the message
               await usersObject.send(denialMessage)
               
        except Exception as e:
            print(f'ERROR: {e}')

        #Make a function to handle a check to ensure the correct DM id is used for interaction

    #@app_commands.command()
    #async def 
        


async def setup(bot):
    await bot.add_cog(Messages(bot))
