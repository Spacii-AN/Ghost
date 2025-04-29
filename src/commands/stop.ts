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
      const noPermsEmbed = new EmbedCreator()
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to use this command.')
        .setColor('#FF0000')
        .setTimestamp()
        .build();
      
      return await interaction.reply({ embeds: [noPermsEmbed], ephemeral: true });
    }

    const user = interaction.options.getUser('user', true);

    // Remove troll
    removeTroll(user.id);

    const embed = new EmbedCreator()
      .setTitle('Trolling Stopped')
      .setDescription(`Stopped trolling ${user}.`)
      .setTimestamp()
      .setColor('#00FF00')
      .build();

      await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};