#######################################
#                                     #
# Bot & Bevy                          #
#                                     #
# Messages Cog Unit Tests             #
# PyTest & DPyTest (Discord PyTest)   #
#                                     #
# Elliott Hager                       #
# Created: 2/27/2025                  #
#######################################

import discord
import pytest
import pytest_asyncio
import discord.ext.test as dpytest

@pytest.mark.asyncio
async def test_create_event(setupBotTest):
    #Set up our test here
    await dpytest.message("Hello!")


