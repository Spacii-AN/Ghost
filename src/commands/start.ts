import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, TextChannel, GuildMemberRoleManager, EmbedBuilder } from 'discord.js';
import { saveTroll } from '../utils/trollmanager';
import { getAllowedRole } from '../utils/roleManager';

export default {
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Start trolling a user')
    .addUserOption(option => option.setName('user').setDescription('User to troll').setRequired(true))
    .addIntegerOption(option => option.setName('duration').setDescription('Duration in minutes').setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.member;
    const allowedRoles = getAllowedRole();
    const hasPermission = member && 'roles' in member && member.roles instanceof GuildMemberRoleManager && member.roles.cache.some(role => allowedRoles.includes(role.id));

    if (!hasPermission) {
      const noPermsEmbed = new EmbedBuilder()
        .setColor(0xED4245) // Red
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to use this command.');

      return await interaction.reply({ embeds: [noPermsEmbed], ephemeral: true });
    }

    const user = interaction.options.getUser('user', true);
    const duration = interaction.options.getInteger('duration', true);
    
    if (duration <= 0) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xED4245) // Red
        .setTitle('Invalid Duration')
        .setDescription('Duration must be greater than 0 minutes.');
      
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // Save troll
    saveTroll(user.id, duration);

    const embed = new EmbedBuilder()
      .setColor(0x57F287) // Green
      .setTitle('Trolling Started')
      .setDescription(`Now trolling ${user} for ${duration} minute(s).\nThe user will be randomly pinged in various channels.`)
      .setTimestamp();

    const stopButton = new ButtonBuilder()
      .setCustomId(`stop_trolling_${user.id}`)
      .setLabel('Stop Trolling')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(stopButton);

    await interaction.reply({ embeds: [embed], components: [row] });

    // Start pinging randomly
    const endTime = Date.now() + duration * 60000;

    const interval = setInterval(async () => {
      if (Date.now() >= endTime) {
        clearInterval(interval);
        return;
      }

      const guild = interaction.guild;
      if (!guild) return;

      const textChannels = guild.channels.cache.filter(
        ch => ch.type === ChannelType.GuildText && (ch as TextChannel).viewable && (ch as TextChannel).permissionsFor(guild.members.me!).has('SendMessages')
      );

      const channels = Array.from(textChannels.values()) as TextChannel[];
      if (channels.length === 0) return;

      const randomChannel = channels[Math.floor(Math.random() * channels.length)];

      try {
        // Send the ghost ping message and delete it quickly
        const message = await randomChannel.send(`${user}`);
        setTimeout(() => {
          message.delete().catch(err => console.error(`Failed to delete message:`, err));
        }, 500); // Delete after 500ms for a proper ghost ping
      } catch (err) {
        console.error(`Failed to send message in ${randomChannel.name}:`, err);
      }
    }, Math.floor(Math.random() * 30000) + 15000); // Random between 15-45 seconds
  }
};