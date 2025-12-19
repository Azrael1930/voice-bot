const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  NoSubscriberBehavior,
  StreamType
} = require("@discordjs/voice");
const { Readable } = require("stream");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const connections = new Map();

/* 🔇 ستريم صامت */
function silentStream() {
  return new Readable({
    read() {
      this.push(Buffer.alloc(3840));
    }
  });
}

/* 🎧 الاتصال بالفويس */
async function connect(channelId, guild) {
  if (connections.has(channelId)) return;

  let channel;
  try {
    channel = await guild.channels.fetch(channelId);
  } catch {
    console.log("❌ ما لقى الروم");
    return;
  }

  if (!channel || channel.type !== 2) {
    console.log("❌ مو روم فويس");
    return;
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: false
  });

  const player = createAudioPlayer({
    behaviors: { noSubscriber: NoSubscriberBehavior.Play }
  });

  const resource = createAudioResource(silentStream(), {
    inputType: StreamType.Raw
  });

  player.play(resource);
  connection.subscribe(player);

  player.on(AudioPlayerStatus.Idle, () => {
    player.play(
      createAudioResource(silentStream(), { inputType: StreamType.Raw })
    );
  });

  connection.on(VoiceConnectionStatus.Disconnected, () => {
    connections.delete(channelId);
    setTimeout(() => connect(channelId, guild), 3000);
  });

  connections.set(channelId, connection);
  console.log(`✅ ثابت في الفويس: ${channel.name}`);
}

/* 🚀 جاهزية البوت */
client.once("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  connect(process.env.VOICE_ID, guild);
});

/* 🔒 KEEP ALIVE — هذا هو الحل */
setInterval(() => {
  console.log("🟢 alive");
}, 60 * 1000);

client.login(process.env.TOKEN);
