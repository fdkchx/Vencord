/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";

import gitHash from "~git-hash";

export const SQAAAKOI_USER_ID = Devs.Sqaaakoi.id + "";

export const CURRENT_WELCOME_NOTICE_VERSION = 1;
export const WELCOME_NOTICE_VERSION_KEY = "SqaaakoiForkSupport_StartupMessageVersion";

// horrible
function friendsOnlyFilter(template: readonly string[], ..._substitutions: (string | [0 | 1, string])[]): (isFriend: boolean) => string {
    const substitutions = [..._substitutions];
    return isFriend => {
        const out: string[] = [];
        for (let i = 0; i < template.length; i++) {
            out.push(template[i]);
            if (i < substitutions.length) {
                if (Array.isArray(substitutions[i])) {
                    if (isFriend === !!substitutions[i][0]) out.push(substitutions[i][1]);
                } else {
                    // @ts-ignore
                    out.push(substitutions[i]);
                }
            }
        }
        return out.join("");
    };
}

export const WELCOME_MESSAGE = friendsOnlyFilter`
# Thanks for installing!
You are running version ${gitHash}
${[1, "hi friend!"]}
${[0, "not for friends"]}
1. a;
2. b;
bleh: heart:
a
${[0, "not for friends"]}
`;
