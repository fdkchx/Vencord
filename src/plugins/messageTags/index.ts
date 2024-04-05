/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { ApplicationCommandInputType, ApplicationCommandOptionType, BUILT_IN, Command, findOption, registerCommand, sendBotMessage, unregisterCommand, unregisterCommandById } from "@api/Commands";
import * as DataStore from "@api/DataStore";
import { definePluginSettings, Settings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { sendMessage } from "@utils/discord";
import definePlugin, { OptionType } from "@utils/types";
import { SnowflakeUtils } from "@webpack/common";

import TagsList, { openEditor } from "./TagsList";

const LEGACY_DATA_KEY = "MessageTags_TAGS";
const MessageTagsMarker = Symbol("MessageTags");

export interface Tag {
    name: string;
    message: string;
    enabled: boolean;
    id: string;
}

async function migrateLegacyTags() {
    if (!(await DataStore.keys()).includes(LEGACY_DATA_KEY)) return;
    const migratedTags = await DataStore.get(LEGACY_DATA_KEY).then<Tag[]>(t => t ?? []);
    const tags = [...getTags(), ...migratedTags.map(i => ({ ...i, message: i.message.replaceAll("\\n", "\n"), id: SnowflakeUtils.fromTimestamp(Date.now()) }))];
    settings.store.tags = JSON.stringify(tags);
    DataStore.del(LEGACY_DATA_KEY);
}

const getTags: () => Tag[] = () => JSON.parse(settings.store.tags);
const getTag = (name: string) => getTags().find(t => t.name === name);
const hasTag = (name: string) => getTags().some(t => t.name === name);
const getTagById = (id: string) => getTags().find(t => t.id === id);
const hasTagById = (id: string) => getTags().some(t => t.id === id);
const addTag = (tag: Tag) => {
    const tags = getTags();
    tags.push(tag);
    settings.store.tags = JSON.stringify(tags);
    return tags;
};
const removeTag = (name: string) => {
    const tags = getTags().filter(t => t.name !== name);
    settings.store.tags = JSON.stringify(tags);
    return tags;
};

function cleanupTagCommands() {
    BUILT_IN.filter(c => c[MessageTagsMarker]).forEach(c => unregisterCommandById(c.id!, "Tags"));
    unregisterCommand("tag", "MessageTags");
    unregisterCommand("t", "MessageTags");
}

function createTagCommand(tag: Tag) {
    registerCommand({
        name: tag.name,
        description: tag.message.split("\n")[0],
        id: tag.id,
        applicationId: tag.id,
        inputType: ApplicationCommandInputType.BUILT_IN_TEXT,
        execute: async (_, ctx) => {
            if (!hasTagById(tag.id)) return;
            if (Settings.plugins.MessageTags.clyde) sendBotMessage(ctx.channel.id, {
                content: `The tag **${tag.name}** has been sent!`
            });
            return { content: getTagById(tag.id)!.message };
        },
        [MessageTagsMarker]: true,
    }, "Tags", false);
}

export const settings = definePluginSettings({
    tags: {
        description: "Tags",
        component: TagsList,
        type: OptionType.COMPONENT,
        default: "[]",
        onChange: () => start()
    },
    clyde: {
        description: "If enabled, Clyde will send you an ephemeral message when a tag was used.",
        type: OptionType.BOOLEAN,
        default: false
    }
});

async function start() {
    await migrateLegacyTags();
    cleanupTagCommands();
    const tags = getTags().filter(t => t.enabled && t.name);
    for (const tag of tags) createTagCommand(tag);
    const command: Command = {
        name: "tag",
        description: "Send predefined messages (tags)",
        inputType: ApplicationCommandInputType.BUILT_IN,
        options: tags.map(tag => ({
            name: tag.id,
            displayName: tag.name,
            description: tag.message.split("\n")[0],
            type: ApplicationCommandOptionType.SUB_COMMAND,
            options: []
        })),
        async execute(args, ctx) {
            const tagName = args[0]?.name;
            if (!tagName) return;
            if (!hasTagById(tagName)) return;
            if (Settings.plugins.MessageTags.clyde) sendBotMessage(ctx.channel.id, {
                content: `The tag **${getTagById(tagName)!.name}** has been sent!`
            });
            sendMessage(ctx.channel.id, { content: getTagById(tagName)!.message });
            return;
        }
    };
    registerCommand({ ...command }, "MessageTags");
    registerCommand({ ...command, name: "t" }, "MessageTags");
}

export default definePlugin({
    name: "MessageTags",
    description: "Allows you to save messages and to use them with a simple command.",
    authors: [Devs.Luna],
    settings,
    dependencies: ["CommandsAPI"],

    start,
    async stop() {
        cleanupTagCommands();
    },

    toolboxActions: {
        "Open Tag Editor": openEditor
    },

    commands: [
        {
            name: "tags",
            description: "Manage all the tags for yourself",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    name: "editor",
                    description: "Open the editor menu",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: []
                },
                {
                    name: "create",
                    description: "Create a new tag",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: [
                        {
                            name: "name",
                            description: "The name of the tag to trigger the response",
                            type: ApplicationCommandOptionType.STRING,
                            required: true
                        },
                        {
                            name: "message",
                            description: "The message that you will send when using this tag",
                            type: ApplicationCommandOptionType.STRING,
                            required: true
                        },
                        {
                            name: "command",
                            description: "Use the tag as a regular command",
                            type: ApplicationCommandOptionType.STRING,
                            required: true
                        }
                    ]
                },
                {
                    name: "list",
                    description: "List all tags from yourself",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: []
                },
                {
                    name: "delete",
                    description: "Remove a tag from your yourself",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: [
                        {
                            name: "name",
                            description: "The name of the tag to trigger the response",
                            type: ApplicationCommandOptionType.STRING,
                            required: true
                        }
                    ]
                },
                {
                    name: "preview",
                    description: "Preview a tag without sending it publicly",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: [
                        {
                            name: "name",
                            description: "The name of the tag to trigger the response",
                            type: ApplicationCommandOptionType.STRING,
                            required: true
                        }
                    ]
                }
            ],

            async execute(args, ctx) {

                switch (args[0].name) {
                    case "editor": {
                        openEditor();
                        break;
                    }
                    case "create": {
                        const name: string = findOption(args[0].options, "name", "");
                        const message: string = findOption(args[0].options, "message", "");

                        // if (hasTag(name))
                        //     return sendBotMessage(ctx.channel.id, {
                        //         content: `A Tag with the name **${name}** already exists!`
                        //     });

                        const tag = {
                            name: name,
                            enabled: true,
                            message: message,
                            id: SnowflakeUtils.fromTimestamp(Date.now())
                        };

                        createTagCommand(tag);
                        addTag(tag);

                        sendBotMessage(ctx.channel.id, {
                            content: `Successfully created the tag **${name}**!`
                        });
                        start();
                        break; // end 'create'
                    }
                    case "delete": {
                        const name: string = findOption(args[0].options, "name", "");

                        if (!getTag(name))
                            return sendBotMessage(ctx.channel.id, {
                                content: `A Tag with the name **${name}** does not exist!`
                            });

                        await removeTag(name);

                        sendBotMessage(ctx.channel.id, {
                            content: `Successfully deleted the tag **${name}**!`
                        });
                        start();
                        break; // end 'delete'
                    }
                    case "list": {
                        sendBotMessage(ctx.channel.id, {
                            embeds: [
                                {
                                    // @ts-ignore
                                    title: "All Tags",
                                    // @ts-ignore
                                    description: (getTags())
                                        .map(tag => `\`${tag.name}\`: ${tag.message.slice(0, 72)}${tag.message.length > 72 ? "..." : ""}`)
                                        .join("\n") || "There are no tags yet, use `/tags create` to create one!",
                                    // @ts-ignore
                                    color: 0xd77f7f,
                                    type: "rich",
                                }
                            ]
                        });
                        break; // end 'list'
                    }
                    case "preview": {
                        const name: string = findOption(args[0].options, "name", "");
                        const tag = getTag(name);

                        if (!tag)
                            return sendBotMessage(ctx.channel.id, {
                                content: `A Tag with the name **${name}** does not exist!`
                            });

                        sendBotMessage(ctx.channel.id, {
                            content: tag.message
                        });
                        break; // end 'preview'
                    }

                    default: {
                        sendBotMessage(ctx.channel.id, {
                            content: "Invalid sub-command"
                        });
                        break;
                    }
                }
            }
        }
    ]
});
