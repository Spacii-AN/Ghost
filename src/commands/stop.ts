import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMemberRoleManager } from 'discord.js';
import { removeTroll } from '../utils/trollmanager';
import { getAllowedRole } from '../utils/roleManager';
import { EmbedCreator } from '../utils/embedBuilder';

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
      const noPermsEmbed = EmbedCreator({
        type: 'error',
        title: 'Permission Denied',
        description: 'You do not have permission to use this command.'
      });

      return await interaction.reply({ embeds: [noPermsEmbed], ephemeral: true });
    }

    const user = interaction.options.getUser('user', true);

    // Remove troll
    removeTroll(user.id);

    const embed = EmbedCreator({
      type: 'success',
      title: 'Trolling Stopped',
      description: `Stopped trolling ${user}.`,
      timestamp: true
    });

    await interaction.reply({ embeds: [embed] });
  }
};