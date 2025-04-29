import { Client, GatewayIntentBits, TextChannel, REST, Routes, SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, GuildMemberRoleManager, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';
import { saveAllowedRole, getAllowedRole, removeAllowedRole } from './utils/roleManager';
import fs from 'fs';
import path from 'path';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const ownerId = process.env.OWNER_ID!;
const token = process.env.DISCORD_TOKEN!;

const activeTrolls = new Map<string, NodeJS.Timeout>();

client.once('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}`);

  const rest = new REST({ version: '10' }).setToken(token);

  const command = new SlashCommandBuilder()
    .setName('troll')
    .setDescription('Troll a user')
    .addSubcommand(sub =>
      sub
        .setName('start')
        .setDescription('Start trolling a user')
        .addUserOption(opt => opt.setName('target').setDescription('User to troll').setRequired(true))
        .addIntegerOption(opt => opt.setName('duration').setDescription('Duration in minutes').setRequired(false))
    )
    .addSubcommand(sub =>
      sub
        .setName('stop')
        .setDescription('Stop trolling a user')
        .addUserOption(opt => opt.setName('target').setDescription('User to stop trolling').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('addrole')
        .setDescription('Add a role allowed to use trolling')
        .addRoleOption(opt => opt.setName('role').setDescription('Role to add').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('removerole')
        .setDescription('Remove an allowed role')
        .addRoleOption(opt => opt.setName('role').setDescription('Role to remove').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('listroles')
        .setDescription('List all roles allowed to troll')
    )
    .addSubcommand(sub =>
      sub
        .setName('status')
        .setDescription('Check who is being trolled')
    );

  try {
    await rest.put(
      Routes.applicationCommands(client.user!.id),
      { body: [command.toJSON()] }
    );
    console.log('Successfully registered application commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'troll') {
    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('target');
    const role = interaction.options.getRole('role');
    const duration = interaction.options.getInteger('duration') ?? 1;

    const allowedRoleIds = getAllowedRole();
    const member = interaction.member;
    const memberRoleIds = (member && 'roles' in member) ? [...(member.roles as GuildMemberRoleManager).cache.keys()] : [];

    const hasPermission = interaction.user.id === ownerId || interaction.memberPermissions?.has('Administrator') || allowedRoleIds.some(id => memberRoleIds.includes(id));

    if (['addrole', 'removerole'].includes(subcommand)) {
      if (interaction.user.id !== ownerId) {
        return interaction.reply({ content: "Only the owner can add or remove roles.", ephemeral: true });
      }

      if (!role) {
        return interaction.reply({ content: "You must select a role.", ephemeral: true });
      }

      if (subcommand === 'addrole') {
        saveAllowedRole(role.id);
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle('Role Added').setDescription(`✅ <@&${role.id}> can now use trolling.`)], ephemeral: true });
      } else if (subcommand === 'removerole') {
        removeAllowedRole(role.id);
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle('Role Removed').setDescription(`❌ <@&${role.id}> can no longer troll.`)], ephemeral: true });
      }
    }

    if (!hasPermission) {
      return interaction.reply({ content: "❌ You don't have permission to use this command!", ephemeral: true });
    }

    if (subcommand === 'listroles') {
      const guildRoles = interaction.guild?.roles.cache;
      const embed = new EmbedBuilder().setTitle('Allowed Troll Roles');

      if (!guildRoles || allowedRoleIds.length === 0) {
        embed.setDescription('⚠️ No roles currently have permission to troll.');
      } else {
        const listed = allowedRoleIds
          .map(id => guildRoles.get(id))
          .filter(role => role !== undefined)
          .map(role => `<@&${role!.id}>`)
          .join('\n');
        embed.setDescription(listed || 'None of the saved roles exist in this server.');
      }

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'status') {
      const embed = new EmbedBuilder().setTitle('Troll Status');
      if (activeTrolls.size === 0) {
        embed.setDescription('Nobody is being trolled.');
      } else {
        embed.setDescription([...activeTrolls.keys()].map(id => `<@${id}>`).join('\n'));
      }
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (!targetUser || !interaction.guild) return;

    if (subcommand === 'start') {
      if (activeTrolls.has(targetUser.id)) {
        return interaction.reply({ content: `${targetUser.username} is already being trolled!`, ephemeral: true });
      }
    
      const trollInterval = setInterval(async () => {
        const channels = interaction.guild!.channels.cache.filter(c => c.isTextBased() && c.type === 0) as Map<string, TextChannel>;
        if (channels.size === 0) return;
    
        const randomChannel = [...channels.values()][Math.floor(Math.random() * channels.size)];
    
        try {
          const message = await randomChannel.send(`<@${targetUser.id}>`);
          setTimeout(() => message.delete().catch(() => {}), 1500);
        } catch (err) {
          console.error('Error sending/deleting message:', err);
        }
      }, Math.random() * (30000 - 15000) + 15000);
    
      activeTrolls.set(targetUser.id, trollInterval);
    
      setTimeout(() => {
        clearInterval(trollInterval);
        activeTrolls.delete(targetUser.id);
      }, duration * 60000);
    
      const embed = new EmbedBuilder()
        .setTitle('🎯 Trolling Started')
        .setDescription(`Now trolling ${targetUser} for **${duration}** minute(s)!`)
        .setColor('Random');
    
      const stopButton = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`stop_troll_${targetUser.id}`)
            .setLabel('🛑 Stop Trolling')
            .setStyle(ButtonStyle.Danger)
        );
    
      await interaction.reply({ embeds: [embed], components: [stopButton], ephemeral: true });
    }
    

    if (subcommand === 'stop') {
      const trollInterval = activeTrolls.get(targetUser.id);
      if (!trollInterval) {
        return interaction.reply({ content: `${targetUser.username} is not being trolled!`, ephemeral: true });
      }

      clearInterval(trollInterval);
      activeTrolls.delete(targetUser.id);
      interaction.reply({ content: `Stopped trolling ${targetUser.username}.`, ephemeral: true });
    }
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const [action, , userId] = interaction.customId.split('_');

  if (action === 'stop' && userId) {
    const trollInterval = activeTrolls.get(userId);

    if (!trollInterval) {
      return interaction.reply({ content: `That user is not being trolled anymore.`, ephemeral: true });
    }

    clearInterval(trollInterval);
    activeTrolls.delete(userId);

    await interaction.reply({ content: `✅ Successfully stopped trolling <@${userId}>.`, ephemeral: true });
  }
});


client.login(token);
