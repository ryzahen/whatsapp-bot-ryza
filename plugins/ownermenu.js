module.exports = {
  commands: ["ownermenu", "owner-menu"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    await ryza.sendMessage(from, {
      text: `▧ *Owner Menu*
[ + ] .owner
[ + ] .ls
[ + ] .fget
[ + ] .ping
[ + ] .autoread on/off`
    }, { quoted: msg })
  }
}