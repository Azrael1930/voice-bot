const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  VoiceConnectionStatus,
} = require("@discordjs/voice");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);
    if (!channel) continue;

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfMute: false,
      selfDeaf: true,
    });

    connection.on(VoiceConnectionStatus.Disconnected, () => {
      console.log("🔁 Reconnecting...");
      setTimeout(() => {
        joinVoiceChannel({
          channelId: channel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
          selfMute: false,
          selfDeaf: true,
        });
      }, 3000);
    });

    console.log(`🎧 Joined ${channel.name}`);
  }
});

client.login(process.env.DISCORD_TOKEN);
