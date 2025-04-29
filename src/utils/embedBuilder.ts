import { EmbedBuilder, ColorResolvable } from 'discord.js';

/**
 * A utility class to build and customize Discord embeds more easily for the Ghost bot
 */
export class EmbedCreator {
  private embed: EmbedBuilder;
  private defaultColor: ColorResolvable = '#8B0000'; // Dark red color for the ghost bot

  constructor() {
    this.embed = new EmbedBuilder();
    this.setDefaultColor();
    this.setTimestamp();
  }

  /**
   * Sets the title of the embed
   * @param title The title to set
   * @returns The EmbedCreator instance for method chaining
   */
  setTitle(title: string): EmbedCreator {
    this.embed.setTitle(title);
    return this;
  }

  /**
   * Sets the description of the embed
   * @param description The description to set
   * @returns The EmbedCreator instance for method chaining
   */
  setDescription(description: string): EmbedCreator {
    this.embed.setDescription(description);
    return this;
  }

  /**
   * Sets the color of the embed
   * @param color The color to set
   * @returns The EmbedCreator instance for method chaining
   */
  setColor(color: ColorResolvable): EmbedCreator {
    this.embed.setColor(color);
    return this;
  }

  /**
   * Sets the default dark red color
   * @returns The EmbedCreator instance for method chaining
   */
  setDefaultColor(): EmbedCreator {
    this.embed.setColor(this.defaultColor);
    return this;
  }

  /**
   * Sets the timestamp to the current time
   * @returns The EmbedCreator instance for method chaining
   */
  setTimestamp(): EmbedCreator {
    this.embed.setTimestamp();
    return this;
  }

  /**
   * Adds a field to the embed
   * @param name The name of the field
   * @param value The value of the field
   * @param inline Whether the field should be inline
   * @returns The EmbedCreator instance for method chaining
   */
  addField(name: string, value: string, inline = false): EmbedCreator {
    this.embed.addFields({ name, value, inline });
    return this;
  }

  /**
   * Sets multiple fields at once
   * @param fields Array of field objects with name, value, and inline properties
   * @returns The EmbedCreator instance for method chaining
   */
  setFields(fields: { name: string; value: string; inline: boolean; }[]): EmbedCreator {
    this.embed.setFields(fields);
    return this;
  }

  /**
   * Sets the footer of the embed
   * @param text The text of the footer
   * @param iconURL The icon URL of the footer
   * @returns The EmbedCreator instance for method chaining
   */
  setFooter(text: string, iconURL?: string): EmbedCreator {
    this.embed.setFooter({ text, iconURL });
    return this;
  }

  /**
   * Sets the type of the embed (for internal use)
   * @param type The type to set
   * @returns The EmbedCreator instance for method chaining
   */
  setType(type: string): EmbedCreator {
    // This is a placeholder method that doesn't actually do anything in Discord.js v14
    // Kept for backward compatibility
    return this;
  }

  /**
   * Builds and returns the Discord embed
   * @returns The built EmbedBuilder
   */
  build(): EmbedBuilder {
    return this.embed;
  }

  /**
   * Creates a ghost ping notification embed
   * @param targetUser The username of the pinged user
   * @param channelName The channel where the ping occurred
   * @returns A new EmbedCreator instance
   */
  static ghostPingEmbed(targetUser: string, channelName: string): EmbedCreator {
    const builder = new EmbedCreator();
    return builder
      .setTitle('👻 Ghost Ping Alert')
      .setDescription(`**${targetUser}** was ghost pinged in #${channelName}!`)
      .setFooter('The message was deleted shortly after being sent');
  }

  /**
   * Creates an error embed with a red color
   * @param title The title of the error embed
   * @param description The description of the error embed
   * @returns A new EmbedCreator instance
   */
  static error(title: string, description: string): EmbedCreator {
    const builder = new EmbedCreator();
    return builder
      .setTitle(`❌ ${title}`)
      .setDescription(description)
      .setColor('#FF0000'); // Bright red for errors
  }

  /**
   * Creates a success embed with a green color
   * @param title The title of the success embed
   * @param description The description of the success embed
   * @returns A new EmbedCreator instance
   */
  static success(title: string, description: string): EmbedCreator {
    const builder = new EmbedCreator();
    return builder
      .setTitle(`✅ ${title}`)
      .setDescription(description)
      .setColor('#00FF00'); // Green for success
  }

  /**
   * Creates an embed with custom parameters
   * @param options Object containing embed options
   * @returns A new EmbedCreator instance
   */
  static create(options: { type?: string; title: string; description: string; }): EmbedCreator {
    const builder = new EmbedCreator();
    return builder
      .setTitle(options.title)
      .setDescription(options.description);
  }

  /**
   * Creates an embed with custom parameters including timestamp
   * @param options Object containing embed options
   * @returns A new EmbedCreator instance
   */
  static createEmbed(options: { type?: string; title: string; description: string; timestamp: boolean; }): EmbedCreator {
    const builder = new EmbedCreator();
    const embed = builder
      .setTitle(options.title)
      .setDescription(options.description);
    
    if (options.timestamp) {
      embed.setTimestamp();
    }
    
    return embed;
  }
}