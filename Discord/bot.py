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
import requests
from dotenv import load_dotenv, dotenv_values

import asyncio

    
async def load_cogs(bot):
    cog_list = [
        'messages'
    ]

    for cog in cog_list:
        await bot.load_extension(f'cogs.{cog}')


async def run_bot():
    #load the .env file
    load_dotenv()

    #define our intents required for the bot
    intents = discord.Intents.default()
    intents.message_content = True
    intents.members = True


    bot = commands.Bot(command_prefix="/", intents=intents)

    #Update the command tree, this ensures all commands show up
    @bot.event
    async def on_ready():
        print("Bot is getting ready")
        await bot.tree.sync()
        print("Bot is ready")


    await load_cogs(bot)

    return bot


#The aysnc function to schedule the pull of the events for the day
async def pullDaysEvents():
    #Set up the API endpoint link
    endPoint = ''

    events = request.get(endPoint)
    events = events.json()

    #Assuming the response will be structured:
    # eventName:
    # eventDate:
    # time: ISO-90
    # discordIDs: {}
    for id in events["discordID"]:
        #calculate the time to send the dm (1hr before the event time)
        time = 0
    
        #Make the reminder message
        reminderMessage = f'**Board & Bevy Event Reminder** \n The following events start in **1 hour**: \n {events["eventName"]}'

        #Schedule the message for the time
        



def main():
    result = asyncio.run(run_bot())

    print(result)

    result.run(os.getenv("DISCORD_TOKEN"))



if __name__ == "__main__":
    main()