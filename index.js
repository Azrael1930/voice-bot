require("ffmpeg-static");

const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus
} = require("@discordjs/voice");

const { Readable } = require("stream");

function silentStream() {
  return Readable.from(Buffer.alloc(3840));
}

const bots = [
  { token: process.env.TOKEN_1, voice: process.env.VOICE_1 },
  { token: process.env.TOKEN_2, voice: process.env.VOICE_2 },
  { token: process.env.TOKEN_3, voice: process.env.VOICE_3 },
  { token: process.env.TOKEN_4, voice: process.env.VOICE_4 },
  { token: process.env.TOKEN_5, voice: process.env.VOICE_5 }
];

for (let i = 0; i < bots.length; i++) {
  startBot(i + 1, bots[i]);
}

function startBot(num, config) {
  if (!config.token || !config.voice) return;

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
  });

  client.once("ready", async () => {
    console.log(`🤖 Bot ${num} logged in`);

    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const channel = await guild.channels.fetch(config.voice);

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false
    });

    const player = createAudioPlayer();
    const resource = createAudioResource(silentStream());

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
      player.play(createAudioResource(silentStream()));
    });

    const reconnect = () => {
      try {
        connection.destroy();
      } catch {}
      setTimeout(() => startBot(num, config), 5000);
    };

    connection.on(VoiceConnectionStatus.Disconnected, reconnect);
    connection.on(VoiceConnectionStatus.Destroyed, reconnect);

    console.log(`✅ Bot ${num} دخل فويس`);
  });

  client.login(config.token);
}
