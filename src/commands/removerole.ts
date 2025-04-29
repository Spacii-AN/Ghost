import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { removeAllowedRole, getAllowedRole } from '../utils/roleManager';

export default {
  data: new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('Remove a role from the list of roles allowed to use troll commands')
    .addRoleOption(option => option.setName('role').setDescription('Role to remove').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    // Only admins can run this command (set in the slash command builder above)
    const role = interaction.options.getRole('role', true);
    const allowedRoles = getAllowedRole();
    
    if (!allowedRoles.includes(role.id)) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xED4245) // Red
        .setTitle('Role Not Found')
        .setDescription(`Role ${role.name} is not in the list of allowed roles.`)
        .setTimestamp();
      
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
    
    removeAllowedRole(role.id);
    
    const embed = new EmbedBuilder()
      .setColor(0x57F287) // Green
      .setTitle('Role Removed')
      .setDescription(`Role ${role.name} has been removed from the list of allowed roles.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};