import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMemberRoleManager, EmbedBuilder } from 'discord.js';
import { removeTroll } from '../utils/trollmanager';
import { getAllowedRole } from '../utils/roleManager';

export default {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop trolling a user')
    .addUserOption(option => option.setName('user').setDescription('User to stop trolling').setRequired(true)),

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

    // Remove troll
    removeTroll(user.id);

    const embed = new EmbedBuilder()
      .setColor(0x57F287) // Green
      .setTitle('Trolling Stopped')
      .setDescription(`Stopped trolling ${user}.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};