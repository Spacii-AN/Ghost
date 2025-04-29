import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { saveAllowedRole } from '../utils/roleManager';
import { EmbedCreator } from '../utils/embedBuilder';

export default {
  data: new SlashCommandBuilder()
    .setName('addrole')
    .setDescription('Add a role to the list of roles allowed to use troll commands')
    .addRoleOption(option => option.setName('role').setDescription('Role to add').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    // Only admins can run this command (set in the slash command builder above)
    const role = interaction.options.getRole('role', true);
    
    saveAllowedRole(role.id);
    
    const embed = EmbedCreator({
      type: 'success',
      title: 'Role Added',
      description: `Role ${role.name} has been added to the list of allowed roles.`,
      timestamp: true
    });

    await interaction.reply({ embeds: [embed] });
  }
};