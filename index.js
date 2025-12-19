function connect(channelId, guild) {
  if (connections.has(channelId)) return;

  const channel = guild.channels.cache.get(channelId);
  if (!channel || channel.type !== 2) return; // Voice channel فقط

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
}
