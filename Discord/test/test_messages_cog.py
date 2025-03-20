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
    sentMsg = await dpytest.message("\\create_event name: Evnt")

    #print(sentMsg.id)

    #Now assert the command message contents and try to check for a thread created
    #print(dpytest.peek(sentMsg.id))


