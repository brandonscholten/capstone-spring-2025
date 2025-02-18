#This file will contain a Discord bot using discord.py, this is the runner, functionality is then
#added in other files and imported here
import discord
from discord.ext import commands
from Messages import foo
import os

from dotenv import load_dotenv, dotenv_values



def main():
    #load the .env file
    load_dotenv()

    #define our intents required for the bot
    intents = discord.Intents.default()
    intents.message_content = True


    bot = commands.Bot(command_prefix="/", intents=intents)


    #Call other supporting commands here and add them to the bot
    bot.command()(foo)

    #Run the bot with the token in the .env file
    bot.run(os.getenv("DISCORD_TOKEN"))



if __name__ == "__main__":
    main()