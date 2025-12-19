const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus
} = require('@discordjs/voice');
const prism = require('prism-media');
const { Readable } = require('stream');

const TOKEN = 'TOKEN_HERE';
const GUILD_ID = 'GUILD_ID_HERE';

// حط 5 رومات فويس هنا
const VOICE_CHANNELS = [
  'VOICE_ID_1',
  'VOICE_ID_2',
  'VOICE_ID_3',
  'VOICE_ID_4',
  'VOICE_ID_5'
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const connections = new Map();

// ستريم صوت صامت
function silentStream() {
  const opus = new prism.opus.Encoder({ rate: 48000, channels: 2, frameSize: 960 });
  const stream = new Readable({
    read() {
      this.push(Buffer.alloc(3840));
    }
  });
  return stream.pipe(opus);
}

function connect(channel, guild) {
  if (connections.has(channel)) return;

  const connection = joinVoiceChannel({
    channelId: channel,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfMute: false,
    selfDeaf: true
  });

  const player = createAudioPlayer();
  const resource = createAudioResource(silentStream());

  player.play(resource);
  connection.subscribe(player);

  player.on(AudioPlayerStatus.Idle, () => {
    player.play(createAudioResource(silentStream()));
  });

  connection.on(VoiceConnectionStatus.Disconnected, () => {
    connections.delete(channel);
    setTimeout(() => connect(channel, guild), 5000);
  });

  connections.set(channel, connection);
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) return;

  VOICE_CHANNELS.forEach(vc => connect(vc, guild));
});

client.login(process.env.TOKEN);
