/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface CssSnippet {
    id: string;
    name: string;
    description: string;
    lastEdited: string;
    enabled: boolean;
    css: string;
}

export interface CssSnippets {
    enabled: boolean;
    list: CssSnippet[];
}
