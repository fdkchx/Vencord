/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classNameFactory } from "@api/Styles";
import { ModalCloseButton, ModalContent, ModalHeader, ModalProps, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { LazyComponent } from "@utils/react";
import { filters, find, findByPropsLazy, findExportedComponentLazy } from "@webpack";
import { React, ScrollerThin, Text } from "@webpack/common";
import { Channel } from "discord-types/general";

import { getVcLogs, vcLogSubscribe, VoiceChannelLogEntry } from "./logs";
import { VoiceChannelLogEntryComponent } from "./VoiceChannelLogEntryComponent";

const IconClasses = findByPropsLazy("icon", "acronym", "childWrapper");
const FriendRow = findExportedComponentLazy("FriendRow");

const cl = classNameFactory("vc-voice-channel-log-");
const { avatar, clickable } = find(filters.byProps("avatar", "zalgo", "clickable"));

export function openVoiceChannelLog(channel: Channel) {
    return openModal(props => (
        <VoiceChannelLogModal
            props={props}
            channel={channel}
        />
    ));
}

export const VoiceChannelLogModal = LazyComponent(() => {

    return function VoiceChannelLogModal({ channel, props }: { channel: Channel; props: ModalProps; }) {
        React.useSyncExternalStore(vcLogSubscribe, () => getVcLogs(channel.id));

        return (
            <ModalRoot
                {...props}
                size={ModalSize.LARGE}
            >
                <ModalHeader>
                    <Text className={cl("header")} variant="heading-lg/semibold" style={{ flexGrow: 1 }}>{channel.name} logs</Text>
                    <ModalCloseButton onClick={props.onClose} />
                </ModalHeader>

                <ModalContent>
                    <ScrollerThin fade className={cl("scroller")}>
                        {getVcLogs(channel.id).map((logEntry: VoiceChannelLogEntry) => {
                            return <VoiceChannelLogEntryComponent logEntry={logEntry} channel={channel} />;
                        })}
                    </ScrollerThin>
                </ModalContent>
            </ModalRoot >
        );
    };
});
