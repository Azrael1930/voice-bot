const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  client.guilds.cache.forEach((guild) => {
    const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);
    if (!channel) return;

    joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false,
    });

    console.log(`🎧 Joined ${channel.name}`);
  });
});

// 🔒 هذا السطر هو اللي يمنع الكراش
setInterval(() => {}, 1 << 30);

client.login(process.env.DISCORD_TOKEN);
