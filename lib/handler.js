const chalk = require("chalk")

async function handler(ryza, msg, command, args, text, from, sender, pushname, plugins) {
  const plugin = plugins.get(command)
  
  if (plugin) {
    try {
      await plugin.execute(ryza, msg, {
        command,
        args,
        text,
        from,
        sender,
        pushname
      })
    } catch (error) {
      console.log(chalk.red(`Error in plugin ${command}:`), error)
      await ryza.sendMessage(from, { 
        text: "Terjadi kesalahan saat menjalankan perintah" 
      }, { quoted: msg })
    }
  }
}

module.exports = { handler }