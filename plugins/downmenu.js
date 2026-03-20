module.exports = {
  commands: ["downmenu", "downloader-menu", "dlmenu"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    await ryza.sendMessage(from, {
      text: `▧ *Downloader Menu*
[ + ] .ig 
[ + ] .tt 
[ + ] .spotify 
[ + ] .play
[ + ] .ytmp3
[ + ] .mediafire`
    }, { quoted: msg })
  }
}