/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findByPropsLazy, findComponentByCodeLazy } from "@webpack";

import { cl, clab } from "./ChannelTabsContainer";

const { ChevronSmallDownIcon } = findByPropsLazy("ChevronSmallDownIcon");
const { ChevronSmallUpIcon } = findByPropsLazy("ChevronSmallUpIcon");
const XIcon = findComponentByCodeLazy("M18.4 4L12 10.4L5.6 4L4 5.6L10.4");


export default function WindowButtons() {

    return <div
        className={cl("window-buttons")}
    >
        <button
            onClick={() => VesktopNative.win.minimize()}
            className={clab("minimize")}
        >
            <ChevronSmallDownIcon height={20} width={20} />
        </button>
        <button
            onClick={() => VesktopNative.win.maximize()}
            className={clab("maximize")}
        >
            <ChevronSmallUpIcon height={20} width={20} />
        </button>
        <button
            onClick={() => VesktopNative.win.close()}
            className={clab("close-window")}
        >
            <XIcon height={16} width={16} />
        </button>

    </div >;
}
