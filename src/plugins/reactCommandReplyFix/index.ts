/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findStoreLazy } from "@webpack";
import { Channel, Message } from "discord-types/general";
import { MessageStore } from "discord-types/stores";

const { getPendingReply } = findStoreLazy("PendingReplyStore");

export default definePlugin({
    name: "ReactCommandReplyFix",
    description: "Patches the built-in +:emoji: command to add the reaction to the message you are replying to.",
    authors: [Devs.Sqaaakoi],
    patches: [
        {
            find: "anyScopeRegex(/^\\+:(.+?): *$/),",
            replacement: {
                match: /(\i\.default)\.getMessages\((\i)\.id\)\.last\(\)/,
                replace: "$self.findReactionTargetMessage($1, $2)"
            }
        }
    ],
    findReactionTargetMessage(messageStore: MessageStore, channel: Channel) {
        const reply: { message: Message; } | undefined = getPendingReply(channel.id);
        if (reply) return messageStore.getMessage(channel.id, reply?.message?.id);
        return (messageStore.getMessages(channel.id) as { last: () => Message; }).last();
    }
});
