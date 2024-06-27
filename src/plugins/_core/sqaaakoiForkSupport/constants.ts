/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";


export const SQAAAKOI_USER_ID = Devs.Sqaaakoi.id + "";

export const CURRENT_WELCOME_NOTICE_VERSION = 1;
export const WELCOME_NOTICE_VERSION_KEY = "SqaaakoiForkSupport_StartupMessageVersion";

// friends or not
const F = (strings: TemplateStringsArray, ...args: any[]) => [true, String.raw(strings, ...args)] as [boolean, string];
const N = (strings: TemplateStringsArray, ...args: any[]) => [false, String.raw(strings, ...args)] as [boolean, string];

// horrible
function friendsOnlyFilter(_template: TemplateStringsArray, ..._substitutions: (string | [boolean, string])[]): (isFriend: boolean) => string {
    const substitutions = [..._substitutions];
    const template = [..._template];
    return isFriend => {
        const out: string[] = [];
        if (template[0] === "\n") template.shift();
        if (template[template.length - 1] === "\n") template.pop();
        for (let i = 0; i < template.length; i++) {
            out.push(template[i]);
            if (i < substitutions.length) {
                if (Array.isArray(substitutions[i])) {
                    if (isFriend === substitutions[i][0]) out.push(substitutions[i][1]);
                } else {
                    // @ts-ignore
                    out.push(substitutions[i]);
                }
            }
        }
        return out.join("").trim();
    };
}

export const WELCOME_HEADER = "Welcome!";
export const WELCOME_BACK_HEADER = "What's New";

export const WELCOME_MESSAGE = friendsOnlyFilter`
**👋 Please migrate to the sqaaakoi-stable-v2 branch**

Please run \`git checkout sqaaakoi-stable-v2\` and build using \`pnpm watch\`

${F`Thank you :)`}
`;
