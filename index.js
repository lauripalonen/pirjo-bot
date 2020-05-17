require('dotenv').config()
const { Client } = require('discord.js')
const client = new Client()
const clientId = '<@710932617154789427>'
const token = process.env.BOT_TOKEN

const queue = new Map();

const ytdl = require('ytdl-core')
const ytpl = require('ytpl')

client.on('warn', console.warn)

client.on('error', console.error)

client.on('ready', () => { console.log('Pirjo is online!') })

client.on('disconnect', () => { console.log('Pirjo disconnected') })

client.on('reconnecting', () => { console.log('Pirjo is reconnecting') })


client.on('message', async msg => {
  if (msg.author.bot) return undefined
  if (!msg.content.startsWith(clientId)) return undefined
  const serverQueue = queue.get(msg.guild.id)

  //----------M-U-S-I-C--------------------//
  if (msg.content.startsWith(`${clientId} musiikkia kiitos!`)) {
    const voiceChannel = msg.member.voice.channel

    //ERROR HANDLING
    if (!voiceChannel) return msg.channel.send(`Anteeksi, mutta en kuule! Tule tiskille sanomaan.`)
    const permissions = voiceChannel.permissionsFor(msg.client.user)

    if (!permissions.has('CONNECT')) {
      return msg.channel.send(`Keittiön ovi on lukossa enkä pääse tiskille. Kutsu lukkoseppä!`)
    }
    if (!permissions.has('SPEAK')) {
      return msg.channel.send('Kurkku on käheä enkä pysty puhumaan. Olisiko sinulla heti-raikkaita mynthon zip mintejä?')
    }

    //FETCH YT-PLAYLIST
    const ytplData = await ytpl('PLfXu6iHMhdDENDD6sfcaswFq2me1lw7Oc')
    const playlist = ytplData.items.map(item => {
      return {
        title: item.title,
        url: item.url_simple
      }
    })

    const shuffle = (playlist) => {
      for (let i = playlist.length; i > 0; i--) {
        const j = Math.floor(Math.random() * i)
        const temp = playlist[i]
        playlist[i] = playlist[j]
        playlist[j] = temp
      }
    }

    shuffle(playlist)

    //GENERATE SERVER QUEUE
    if (!serverQueue) {
      const queueConstruct = {
        textChannel: msg.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: null,
        volume: 0.5,
        playing: true
      }
      queue.set(msg.guild.id, queueConstruct)

      queueConstruct.songs = playlist
      try {
        var connection = await voiceChannel.join()
        queueConstruct.connection = connection
        play(msg.guild, queueConstruct.songs[0])
      } catch (error) {
        console.log(`Could not join the voice channel: ${error}`)
        queue.delete(msg.guild.id)
        return msg.channel.send(`beep boop zzzr: ${error}`)
      }
    } else {
      serverQueue.songs = playlist
      console.log('playlist added to server queue')
    }

    return undefined

    // PLAYBACK OPTIONS
  } else if (msg.content === (`${clientId} laittaisitko musiikin pois?`)) {
    if (!msg.member.voice) return msg.channel.send(`Tule tiskille sanomaan, en kuule!`)
    if (!serverQueue) return msg.channel.send('Ei täällä soi mikään.')
    serverQueue.connection.dispatcher.pause()
    return undefined

  } else if (msg.content === (`${clientId} anna musiikin soida!`)) {
    if (!msg.member.voice) return msg.channel.send(`Tule tiskille sanomaan, en kuule!`)
    if (!serverQueue) return msg.channel.send(`Ei täällä soi mikään.`)
    serverQueue.connection.dispatcher.resume()
    return undefined

  } else if (msg.content === (`${clientId} kiitos musiikista!`)) {
    serverQueue.songs = []
    serverQueue.connection.dispatcher.end()
    msg.member.voice.channel.leave()
    return undefined
  }

  //----------S-O-C-I-A-L----------------//
  if (msg.content === `${clientId} hei!`) {
    msg.channel.send('Hei!')
  }

  if (msg.content === `${clientId} ensi viikkoon!`) {
    msg.channel.send('Ensi viikkoon!')
      .then(() => client.destroy())
  }

  //OTHER
  if (msg.content === `${clientId} saisiko kahvia kiitos?`) {
    msg.channel.send('Laitan vedenkeittimen päälle. Tuon kahvin pöytään!')
    setTimeout(() => { msg.reply('tässä kahvi ole hyvä! :coffee:') }, 60000 * 120)
  }

  if (msg.content === `${clientId} hyvää keskiviikkoa!`) {
    msg.channel.send('Hyvää keskiviikkoa!')
  }

  return undefined
})

function play(guild, song) {
  console.log('SONG: ', song)
  const serverQueue = queue.get(guild.id)

  if (!song) {
    serverQueue.voiceChannel.leave()
    queue.delete(guild.id)
    return
  }

  const dispatcher = serverQueue.connection.play(ytdl(song.url))
    .on('end', () => {
      console.log('Trying to end the song!')
    })
    .on('error', error => console.log(error))
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)
}

client.login(token)

