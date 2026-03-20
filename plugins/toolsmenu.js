module.exports = {
  commands: ["toolsmenu", "tools-menu"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    await ryza.sendMessage(from, {
      text: `▧ *Tools Menu*
[ + ] .get <url>
[ + ] .cekid
[ + ] .ssweb <url>
[ + ] .tourl
[ + ] .hd`
    }, { quoted: msg })
  }
}