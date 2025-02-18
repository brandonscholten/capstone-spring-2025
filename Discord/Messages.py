import discord
from discord.ext import commands


async def foo(ctx, arg):
    await ctx.send(arg)