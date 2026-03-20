const fs = require("fs")
const path = require("path")
const axios = require("axios")
const chalk = require("chalk")

async function loadPlugins() {
  const plugins = new Map()
  const pluginsDir = path.join(__dirname, "../plugins")
  
  const loadFromDir = (dir) => {
    const files = fs.readdirSync(dir)
    
    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory()) {
        loadFromDir(filePath)
      } else if (file.endsWith(".js") && file !== "example.js") {
        try {
          const plugin = require(filePath)
          if (plugin.commands && Array.isArray(plugin.commands)) {
            plugin.commands.forEach(cmd => {
              plugins.set(cmd.toLowerCase(), plugin)
            })
          }
        } catch (err) {
          console.log(chalk.red(`Error loading ${file}: ${err.message}`))
        }
      }
    }
  }
  
  loadFromDir(pluginsDir)
  console.log(chalk.hex('#FFA500').bold("Layanan Kebutuhan Digital Hanya Di www.henshop.biz.id"))
  return plugins
}

async function react(ryza, from, msg, emoji) {
  await ryza.sendMessage(from, {
    react: {
      text: emoji,
      key: msg.key
    }
  })
}

function formatNumber(number) {
  return number?.toLocaleString() || '0'
}

function formatDuration(seconds) {
  if (!seconds) return "00:00"
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

async function fetchJson(url, options = {}) {
  try {
    const response = await axios(url, options)
    return response.data
  } catch (e) {
    return null
  }
}

function getFormattedDate() {
  const date = new Date()
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `[ ${day}/${month}/${year} ]`
}

module.exports = {
  loadPlugins,
  react,
  formatNumber,
  formatDuration,
  fetchJson,
  getFormattedDate
}