async function connect(channelId, guild) {
  if (!channelId) return;
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

  connection.on(VoiceConnectionStatus.Destroyed, () => {
    connections.delete(channelId);
    setTimeout(() => connect(channelId, guild), 5000);
  });

  connections.set(channelId, connection);
  console.log(`✅ دخل الفويس: ${channel.name}`);
}
