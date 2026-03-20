const { react } = require("../lib/functions")
const config = require("../config")

module.exports = {
  commands: ["menu", "help", "allmenu"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    const senderNumber = sender.split('@')[0]
    
    const menuText = `Hai  @${senderNumber}
Ada yang bisa saya bantu kak?

Bot ini dapat digunakan sebagai *unduhan media*, *penjaga grup*, *dan lainnya* yang dapat membuat kamu lebih mudah untuk menjalani hari-hari.

╭  ◦ Creator: *${config.owner.name}*
│  ◦ Website: *${config.owner.website}*
╰  ◦ Prefix: *[ ${config.bot.prefix} ]*

Harap untuk bergabung grup bot agar mengetahui informasi bot jika *error/banned*

▧ *Menu Available*
[ + ] ownermenu
[ + ] groupmenu
[ + ] downmenu
[ + ] toolsmenu

> Powered By ${config.owner.name}`

    await ryza.sendMessage(from, {
      image: { url: './source/menu.jpg' },
      caption: menuText,
      mentions: [sender]
    }, { quoted: msg })
  }
}