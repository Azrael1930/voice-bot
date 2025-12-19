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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;

const VOICE_CHANNELS = [
  process.env.VOICE_1,
  process.env.VOICE_2,
  process.env.VOICE_3,
  process.env.VOICE_4,
  process.env.VOICE_5
];

const connections = new Map();

/* صوت صامت */
function silentStream() {
  const opus = new prism.opus.Encoder({
    rate: 48000,
    channels: 2,
    frameSize: 960
  });

  const stream = new Readable({
    read() {
      this.push(Buffer.alloc(3840));
    }
  });

  return stream.pipe(opus);
}

/* دخول فويس */
async function connect(channelId, guild) {
  if (!channelId || connections.has(channelId)) return;

  let channel;
  try {
    channel = await guild.channels.fetch(channelId);
  } catch {
    console.log(`❌ ما قدر يجيب الروم: ${channelId}`);
    return;
  }

  if (!channel || channel.type !== 2) {
    console.log(`❌ مو روم فويس: ${channelId}`);
    return;
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
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
    connections.delete(channelId);
    setTimeout(() => connect(channelId, guild), 5000);
  });

  connections.set(channelId, connection);
  console.log(`✅ دخل الفويس: ${channel.name}`);
}

/* أمر !join */
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content !== '!join') return;

  const guild = message.guild;
  if (!guild || guild.id !== GUILD_ID) return;

  VOICE_CHANNELS.forEach(vc => connect(vc, guild));
  message.reply('✅ دخلت الفويسات');
});

client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.login(TOKEN);
