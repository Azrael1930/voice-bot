const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} = require("@discordjs/voice");
const { Readable } = require("stream");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const connections = new Map();

function silentStream() {
  return Readable.from(Buffer.alloc(3840));
}

async function connect(channelId, guild) {
  if (connections.has(channelId)) return;

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel || channel.type !== 2) return;

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfMute: false,
    selfDeaf: true,
  });

  const player = createAudioPlayer();
  const resource = createAudioResource(silentStream());

  player.play(resource);
  connection.subscribe(player);

  player.on(AudioPlayerStatus.Idle, () => {
    player.play(createAudioResource(silentStream()));
  });

  connection.on(VoiceConnectionStatus.Disconnected, () => {
    connections.delete(channelId);
    setTimeout(() => connect(channelId, guild), 5000);
  });

  connections.set(channelId, connection);
  console.log(`✅ دخل الفويس: ${channel.name}`);
}

client.once("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  const guild = await client.guilds.fetch(process.env.GUILD_ID).catch(() => null);
  if (!guild) return console.log("❌ Guild not found");

  connect(process.env.VOICE_CHANNEL_ID, guild);
});

// 🔒 هذا السطر هو اللي يمنع الكراش
setInterval(() => {
  console.log("🟢 Bot alive");
}, 60_000);

client.login(process.env.DISCORD_TOKEN);
