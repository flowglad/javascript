import { Client, GatewayIntentBits } from 'discord.js'

export const runtime = 'nodejs' // Force Node.js runtime instead of Edge

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
  ],
})

// // Initialize client
// client.login(process.env.DISCORD_BOT_TOKEN)

export const sendFormSubmissionToDiscord = async (formData: {
  industry: string
  dashboardTypes: string
  dashboardDesignAssets: string
}) => {
  try {
    // Wait for client to be ready if needed
    if (!client.isReady()) {
      await new Promise((resolve) => client.once('ready', resolve))
    }

    const channel = await client.channels.fetch('1313625027941498911')
    if (!channel?.isTextBased() || !('send' in channel)) return

    await channel.send({
      embeds: [
        {
          title: 'Dashboard Design+ Brief',
          fields: [
            {
              name: 'Industry',
              value: formData.industry || 'N/A',
              inline: true,
            },
            {
              name: 'Dashboard Types',
              value: formData.dashboardTypes || 'N/A',
              inline: true,
            },
            {
              name: 'Existing Dashboard Design Assets',
              value: formData.dashboardDesignAssets || 'N/A',
              inline: false,
            },
          ],
        },
      ],
    })
  } catch (error) {
    console.error('Discord error:', error)
  }
}
