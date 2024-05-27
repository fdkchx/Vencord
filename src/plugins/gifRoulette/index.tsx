/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { UserSettingsActionCreators } from "@webpack/common";
import { Guild } from "discord-types/general";

function random(array: string | any[]) {
    return array[Math.floor((crypto.getRandomValues(new Uint32Array(1))[0] * Math.pow(2, -32)) * array.length)];
}

function getMessage({ guild }: { guild?: Guild; }) {
    const frecencyStore = UserSettingsActionCreators.FrecencyUserSettingsActionCreators.getCurrentValue();

    const gifsArray = Object.keys(frecencyStore.favoriteGifs.gifs);

    const chosenGifUrls: string[] = [];

    for (let i = 0; i < Math.random() * 5; i++) {
        chosenGifUrls.push(random(gifsArray));
    }

    const ownerPing = settings.store.pingOwnerChance && guild && Math.random() <= 0.1 ? ` <@${guild.ownerId}>` : "";

    return chosenGifUrls.join(" ") + ownerPing;
}


const settings = definePluginSettings({
    pingOwnerChance: {
        type: OptionType.BOOLEAN,
        description: "If there should be a 1 in 10 change to ping the owner of the guild (oh no)",
        default: true
    }
});

export default definePlugin({
    name: "GifRoulette",
    description: "Adds a command to send 1-5 random gifs from your favourites, and a one in ten chance to ping the owner of the server",
    authors: [Devs.Samwich, Devs.Sqaaakoi],
    dependencies: ["CommandsAPI"],
    settings,
    commands: [
        {
            name: "gifroulette",
            description: "Time to tempt your fate",
            execute: (_args, ctx) => ({
                content: getMessage(ctx)
            }),
        }
    ]
});
