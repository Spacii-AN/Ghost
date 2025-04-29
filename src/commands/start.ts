import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, TextChannel, GuildMemberRoleManager } from 'discord.js';
import { saveTroll, storeInterval } from '../utils/trollmanager';
import { getAllowedRole } from '../utils/roleManager';
import { EmbedCreator } from '../utils/embedBuilder';

export default {
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Start trolling a user')
    .addUserOption(option => option.setName('user').setDescription('User to troll').setRequired(true))
    .addIntegerOption(option => option.setName('duration').setDescription('Duration in minutes').setRequired(true))
    .addIntegerOption(option => 
      option.setName('frequency')
        .setDescription('Average ping frequency in seconds (default: 30)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.member;
    const allowedRoles = getAllowedRole();
    const hasPermission = member && 'roles' in member && member.roles instanceof GuildMemberRoleManager && member.roles.cache.some(role => allowedRoles.includes(role.id));

    if (!hasPermission) {
      const noPermsEmbed = new EmbedCreator()
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to use this command.')
        .setColor('#FF0000')
        .setTimestamp()
        .build();
      
      return await interaction.reply({ embeds: [noPermsEmbed], ephemeral: true });
    }

    const user = interaction.options.getUser('user', true);
    const duration = interaction.options.getInteger('duration', true);
    
    // Default frequency is 30 seconds, with a range of ± 15 seconds
    const avgFrequency = interaction.options.getInteger('frequency') || 30;
    const freqVariance = Math.floor(avgFrequency / 2);
    
    // Make sure frequency is reasonable
    if (avgFrequency < 5) {
      const errorEmbed = new EmbedCreator()
        .setTitle('Invalid Frequency')
        .setDescription('Ping frequency cannot be less than 5 seconds.')
        .setColor('#FF0000')
        .setTimestamp()
        .build();
      
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // Save troll
    saveTroll(user.id, duration);

    const embed = new EmbedCreator()
      .setTitle('Trolling Started')
      .setDescription(`Now trolling ${user} for ${duration} minute(s).\nPing frequency: ~${avgFrequency} seconds.`) 
      .setColor('#00FF00')
      .setTimestamp()
      .build();

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
        const message = await randomChannel.send(`<@${user.id}>`);
        setTimeout(() => {
          message.delete().catch(err => console.error(`Failed to delete message:`, err));
        }, 500); // Delete after 500ms for a proper ghost ping
      } catch (err) {
        console.error(`Failed to send message in ${randomChannel.name}:`, err);
      }
    }, Math.floor(Math.random() * (freqVariance * 2)) + (avgFrequency - freqVariance) * 1000); // Random frequency based on input
    
    // Store the interval so it can be stopped later
    storeInterval(user.id, interval);
  }
};