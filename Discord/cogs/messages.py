import discord
from discord.ext import commands
from discord import app_commands


class Messages(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="list_events", description="Creates an event and allows users to RSVP")
    async def listevents(self, interaction: discord.Interaction):
       #Temp list to hold items to list out the events


        return

    @app_commands.command(name="list_games", description="Lists the current game collection of Board & Bevy")
    async def listGames(self, interaction: discord.Interaction):
        #Place holder data
        games= [
            "Catan",
            "MtG",
            "Dont forget to implement Birthdays!"
        ]

        #Call API HERE and collect titles!

        gameString = f''

        #Go through the games and add them as bullet points
        for game in games:
            gameString += f'\n * {game}'


        #Send the games back in an message
        await interaction.response.send_message(gameString)
    
    
    
    @app_commands.command(name="create_event", description="Creates an event and allows users to RSVP")
    #@app_commands.describe(eventName="the name of the event")
    async def createEvent(self, interaction: discord.Interaction):
        #process the event with the API, and make response based on the code returned

        #await interaction.response.send_message("Event has been scheduled successfully!")


        #Ask if the person would like to book the private room for the event?
        await interaction.followup.send("Would you like to book a private room for the event (Can do half and full room)? \n\n 👍 - Yes \n\n 👎- No ")

        #Grab the message to then add the valid reactions to make it easier on the user
        privateRoomWanted = await interaction.original_response()

        #Adds in the options for valid reactions
        await privateRoomWanted.add_reaction("👍")
        await privateRoomWanted.add_reaction("👎")

        #Await for the user to react to the message
        try:
            reaction, user = await self.bot.wait_for('reaction_add', timeout=60)
            if str(reaction.emoji) == "👍":
                await interaction.followup.send("If you would like to book the backroom for this event, please visit one of the two links below:\n HALF ROOM \n FULL ROOM")
            #elif str(reaction.emoji) == "👎":
                #do nothing or still deciding on what to do
        except TimeoutError:
            await interaction.followup.send("Time out awaiting for a reaction, please try again")
        
        await interaction.followup.send("Thank you for scheduling your event!")


        

    




async def setup(bot):
    await bot.add_cog(Messages(bot))
