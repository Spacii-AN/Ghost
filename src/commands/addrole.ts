import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { saveAllowedRole } from '../utils/roleManager';
import { createEmbed } from '../utils/embedBuilder';

export default {
  data: new SlashCommandBuilder()
    .setName('addrole')
    .setDescription('Add a role that can use the bot')
    .addRoleOption(option => option.setName('role').setDescription('Role to add').setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has('Administrator')) {
      const noPermsEmbed = createEmbed({
        type: 'error',
        title: 'Permission Denied',
        description: 'You need Administrator permissions to use this command.'
      });

      return await interaction.reply({ embeds: [noPermsEmbed], ephemeral: true });
    }

    const role = interaction.options.getRole('role', true);
    saveAllowedRole(role.id);

    const successEmbed = createEmbed({
      type: 'success',
      title: 'Role Added',
      description: `${role} can now use the bot commands.`
    });

    await interaction.reply({ embeds: [successEmbed] });
  }
};