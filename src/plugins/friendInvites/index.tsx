/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { Devs } from "@utils/constants";
import { sendMessage } from "@utils/discord";
import definePlugin from "@utils/types";
import { extractAndLoadChunksLazy, findByCodeLazy, findByPropsLazy } from "@webpack";

import FriendInviteForm from "./components/FriendInviteForm";
import QRCodeButton from "./components/QRCodeButton";

export const FriendInvites = findByPropsLazy("createFriendInvite");

export let InviteRow = (props: any) => null as unknown as JSX.Element;

// dependencies used elsewhere
export const requireQRCode = extractAndLoadChunksLazy([".qrCodeButtonContent"]);
export const requireInvite = extractAndLoadChunksLazy(["InstantInviteSources.SETTINGS_INVITE"]);
export const linkify = findByCodeLazy("window.GLOBAL_ENV.INVITE_HOST", "/invite/");

const { uuid4 } = findByPropsLazy("uuid4");

export default definePlugin({
    name: "FriendInvites",
    description: "Create and manage friend invite links via slash commands (/create friend invite, /view friend invites, /revoke friend invites).",
    authors: [Devs.afn, Devs.Dziurwa, Devs.Sqaaakoi],
    dependencies: ["CommandsAPI"],
    commands: [
        {
            name: "friend-invites create",
            description: "Generates a friend invite link.",
            inputType: ApplicationCommandInputType.BOT,
            options: [{
                name: "send",
                description: "Send invite to chat",
                required: false,
                type: ApplicationCommandOptionType.BOOLEAN
            }],

            execute: async (args, ctx) => {
                const send = findOption<boolean>(args, "send", false);

                const invite = await FriendInvites.createFriendInvite();

                sendBotMessage(ctx.channel.id, {
                    content: `
                        discord.gg/${invite.code} ·
                        Expires: <t:${new Date(invite.expires_at).getTime() / 1000}:R> ·
                        Max uses: \`${invite.max_uses}\`
                    `.trim().replace(/\s+/g, " ")
                });

                if (send) sendMessage(ctx.channel.id, { content: linkify(invite.code) });
            }
        },
        {
            name: "friend-invites list",
            description: "View a list of all generated friend invites.",
            inputType: ApplicationCommandInputType.BOT,
            execute: async (_, ctx) => {
                const invites = await FriendInvites.getAllFriendInvites();
                const friendInviteList = invites.map(i =>
                    `
                    _discord.gg/${i.code}_ ·
                    Expires: <t:${new Date(i.expires_at).getTime() / 1000}:R> ·
                    Times used: \`${i.uses}/${i.max_uses}\`
                    `.trim().replace(/\s+/g, " ")
                );

                sendBotMessage(ctx.channel.id, {
                    content: friendInviteList.join("\n") || "You have no active friend invites!"
                });
            },
        },
        {
            name: "friend-invites delete",
            description: "Revokes all generated friend invites.",
            inputType: ApplicationCommandInputType.BOT,
            execute: async (_, ctx) => {
                await FriendInvites.revokeFriendInvites();

                sendBotMessage(ctx.channel.id, {
                    content: "All friend invites have been revoked."
                });
            },
        },
    ],
    patches: [
        // Do not reorder these patches!
        {
            find: ".inviteSettingsInviteRow",
            replacement: [
                {
                    match: /function\s(\i).{0,40}\{invite:/,
                    replace: "$self.setInviteRowComponent($1);$&"
                },
                {
                    match: /(null==\(\i=\i\.inviter\)\?)/,
                    replace: "arguments[0].vencordFriendInvite?$self.QRCodeButton(arguments[0].invite):$1"
                },
                {
                    match: /(grow:)(\i.INVITER,basis:)/,
                    replace: "$1arguments[0].vencordFriendInvite?0:$2arguments[0].vencordFriendInvite?'auto':"
                },
                {
                    match: /\(0,\i\.jsx\)\(\i\.default,\{className:\i\.revokeInvite,/,
                    replace: "arguments[0].vencordFriendInvite||$&"
                },
            ]
        },
        {
            find: "backToSchoolEnabled)()&&(0",
            replacement: {
                match: /(Messages\.ADD_FRIEND\}\),)(\(0,\i\.jsx\))\(i\.default,\{\}\)/,
                replace: "$&,$2($self.FriendInviteForm,{})"
            }
        }
    ],
    setInviteRowComponent(c: () => JSX.Element) {
        InviteRow = c;
    },
    FriendInviteForm,
    QRCodeButton
});
