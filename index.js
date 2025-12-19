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

const connections = new Map();

/* 🔇 صوت وهمي عشان البوت ما ينسحب */
function silentStream() {
  return new Readable({
    read() {
      this.push(Buffer.alloc(3840));
    }
  });
}

/* 🎧 الدالة الكاملة */
async function connect(channelId, guild) {
  if (connections.has(channelId)) return;

  let channel;
  try {
    channel = await guild.channels.fetch(channelId);
  } catch (err) {
    console.log(`❌ ما قدرت أجيب الروم: ${channelId}`);
    return;
  }

  if (!channel || channel.type !== 2) {
    console.log(`❌ الروم مو فويس: ${channelId}`);
    return;
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfMute: false,
    selfDeaf: true
  });

  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play
    }
  });

  const resource = createAudioResource(silentStream(), {
    inputType: StreamType.Raw
  });

  player.play(resource);
  connection.subscribe(player);

  // 🔁 لو وقف الصوت يرجع يشغله
  player.on(AudioPlayerStatus.Idle, () => {
    player.play(
      createAudioResource(silentStream(), {
        inputType: StreamType.Raw
      })
    );
  });

  // 🔁 لو انقطع يرجع يدخل
  connection.on(VoiceConnectionStatus.Disconnected, () => {
    connections.delete(channelId);
    console.log("🔄 انقطع الاتصال.. إعادة الدخول");
    setTimeout(() => connect(channelId, guild), 3000);
  });

  connection.on(VoiceConnectionStatus.Destroyed, () => {
    connections.delete(channelId);
    console.log("❌ تم التدمير.. إعادة الدخول");
    setTimeout(() => connect(channelId, guild), 3000);
  });

  connections.set(channelId, connection);
  console.log(`✅ دخل وثبت في الفويس: ${channel.name}`);
}
