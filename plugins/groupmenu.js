module.exports = {
  commands: ["groupmenu", "group-menu"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    await ryza.sendMessage(from, {
      text: `▧ *Group Menu*
[ + ] .kick
[ + ] .add
[ + ] .delete
[ + ] .promote
[ + ] .demote
[ + ] .hidetag
[ + ] .setname
[ + ] .setdesk
[ + ] .linkgc
[ + ] .resetlink
[ + ] .gcclose 
[ + ] .gcopen 
[ + ] .welcome
[ + ] .antilink
[ + ] .welcome`
    }, { quoted: msg })
  }
}