const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  const channel = await guild.channels.fetch(process.env.VOICE_CHANNEL_ID);

  if (!channel || channel.type !== ChannelType.GuildVoice) {
    console.log('❌ روم فويس غير صحيح');
    return;
  }

  joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfMute: true,
    selfDeaf: true
  });

  console.log(`🎧 دخل الفويس: ${channel.name}`);
});

client.login(process.env.TOKEN);
