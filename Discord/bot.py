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


    bot = commands.Bot(command_prefix="/", intents=intents)

    #Update the command tree, this ensures all commands show up
    @bot.event
    async def on_ready():
        print("Bot is getting ready")
        await bot.tree.sync()
        print("Bot is ready")


    await load_cogs(bot)

    return bot

def main():
    result = asyncio.run(run_bot())

    print(result)

    result.run(os.getenv("DISCORD_TOKEN"))




if __name__ == "__main__":
    main()