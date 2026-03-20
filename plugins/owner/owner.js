const config = require("../../config")

module.exports = {
  commands: ["owner", "creator", "author"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    const contacts = [
      {
        displayName: "ryzahen.site",
        vcard: `BEGIN:VCARD
VERSION:3.0
FN:ryzahen.site
TEL;type=CELL;type=VOICE;waid=${config.owner.numbers[1]}:+${config.owner.numbers[1]}
END:VCARD`
      }
    ]
    
    await ryza.sendMessage(from, {
      contacts: {
        displayName: "Owner",
        contacts: contacts
      }
    }, { quoted: msg })
  }
}