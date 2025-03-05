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

from bot import *

@pytest_asyncio.fixture
async def setupBotTest():
    #Set up the bot from the runner
    bot
