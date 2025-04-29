import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMemberRoleManager, EmbedBuilder } from 'discord.js';
import { getTrolls, TrollEntry } from '../utils/trollmanager';
import { getAllowedRole } from '../utils/roleManager';

export default {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check active trolls'),

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

    const trolls = getTrolls().filter(troll => troll.endTime > Date.now());
    
    if (trolls.length === 0) {
      const noTrollsEmbed = new EmbedBuilder()
        .setColor(0x5865F2) // Discord Blurple
        .setTitle('No Active Trolls')
        .setDescription('There are no active trolls at the moment.');
      
      return await interaction.reply({ embeds: [noTrollsEmbed] });
    }
    
    // Create fields for each troll
    const fields = await Promise.all(trolls.map(async (troll: TrollEntry) => {
      try {
        const user = await interaction.client.users.fetch(troll.userId);
        const minutesLeft = Math.ceil((troll.endTime - Date.now()) / 60000);
        
        return {
          name: user.tag,
          value: `<@${troll.userId}>\nTime left: ${minutesLeft} minute(s)`,
          inline: true
        };
      } catch (error) {
        return {
          name: `Unknown User (${troll.userId})`,
          value: `Time left: ${Math.ceil((troll.endTime - Date.now()) / 60000)} minute(s)`,
          inline: true
        };
      }
    }));
    
    const statusEmbed = new EmbedBuilder()
      .setColor(0x5865F2) // Discord Blurple
      .setTitle('Active Trolls')
      .setDescription(`There are ${trolls.length} active trolls:`)
      .addFields(fields)
      .setTimestamp();
    
    await interaction.reply({ embeds: [statusEmbed] });
  }
};