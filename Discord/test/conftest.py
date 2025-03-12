#######################################
#                                     #
# Bot & Bevy                          #
#                                     #
# Unit Test Configuration & Startup   #
# PyTest & DPyTest (Discord PyTest)   #
#                                     #
# Elliott Hager                       #
# Created: 2/27/2025                  #
#######################################

import os
import pytest_asyncio
import discord
import dotenv
import discord.ext.test as dpytest
from discord.ext import commands
from dotenv import load_dotenv, dotenv_values


#Function to load all of the cogs for the bot, this is the same as the runner
#just copied over for ease
async def load_cogs(bot):
    cog_list = [
        'messages'
    ]

    for cog in cog_list:
        await bot.load_extension(f'cogs.{cog}')


@pytest_asyncio.fixture
async def setupBotTest():
    #Load the env file  
    load_dotenv()

    #Grab the Discord bot key
    discordKey = os.getenv("DISCORD_TOKEN")


    #Set up the bot intents, this ensures the fake user is using the proper permissions
    intents = discord.Intents.default()
    intents.members = True
    intents.message_content = True

    #Set up the bot
    bot = commands.Bot(command_prefix="/", intents=intents)

    #Update the command tree, this ensures all commands show up
    @bot.event
    async def on_ready():
        print("Bot is getting ready")
        await bot.tree.sync()
        print("Bot is ready")

    #load the cogs
    await load_cogs(bot)

    await bot._async_setup_hook()
    dpytest.configure(bot)

    return bot




#tear down functions
@pytest_asyncio.fixture(autouse=True)
async def cleanup():
    await dpytest.empty_queue()
