/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DataStore } from "@api/index";
import { Link } from "@components/Link";
import { closeModal, ModalContent, ModalFooter, ModalHeader, ModalProps, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { Button, Flex, Forms, RelationshipStore, Text, useEffect, useState } from "@webpack/common";

import { CURRENT_WELCOME_NOTICE_VERSION, SQAAAKOI_USER_ID, WELCOME_NOTICE_VERSION_KEY } from "./constants";

// First time run card
export function WelcomeModal({ modalProps, close, isFriend }: { modalProps: ModalProps; close: () => void; isFriend: boolean; }) {
    const [unlocked, setUnlocked] = useState(false);
    const [closing, setClosing] = useState(false);
    useEffect(() => {
        setTimeout(() => setUnlocked(true), (isFriend ? 5000 : 15000) + ((Math.random() - 0.5) * 5));
    });

    if (closing && unlocked) {
        close();
        DataStore.set(WELCOME_NOTICE_VERSION_KEY, CURRENT_WELCOME_NOTICE_VERSION);
    }

    return <ModalRoot {...modalProps} size={ModalSize.MEDIUM}>
        <ModalHeader>
            <Text variant="heading-lg/semibold" style={{ flexGrow: 1, textAlign: "center" }}>Welcome!</Text>
        </ModalHeader>
        <ModalContent>
            <Forms.FormSection>
                <Forms.FormTitle tag="h3">A note from Sqaaakoi before you continue</Forms.FormTitle>
                <Forms.FormText>
                    Thank you for installing my fork of Vencord!<br />
                    It contains all of the plugins I created, and some extra plugins I find useful.<br />
                    These plugins are developed as a hobby in my spare time for fun.<br />
                    For more information about the included features, take a look at the <Link href="https://github.com/Sqaaakoi/Vencord#readme">README</Link>
                </Forms.FormText>
            </Forms.FormSection>
            <br />
            <Forms.FormSection>
                <Forms.FormTitle>Support</Forms.FormTitle>
                <Forms.FormText>
                    If you experience any issues with this fork, please submit an issue on <Link href="https://github.com/Sqaaakoi/Vencord/issues">GitHub</Link><br />
                    Please don't go bother any Vencord developers for bugs you experience here. It likely isn't their fault.
                </Forms.FormText>
            </Forms.FormSection>
        </ModalContent>
        <ModalFooter>
            <Flex flexDirection="row">
                <Forms.FormTitle>Run /welcome-modal to open this later</Forms.FormTitle>
                <Button
                    color={Button.Colors.GREEN}
                    submitting={closing}
                    onClick={() => setClosing(true)}
                >
                    Continue
                </Button>
            </Flex>
        </ModalFooter>
    </ModalRoot>;
}

export async function openWelcomeModal(force: boolean) {
    if (!force) {
        const currentVersion = (await DataStore.get<number>(WELCOME_NOTICE_VERSION_KEY)) || 0;
        if (currentVersion >= CURRENT_WELCOME_NOTICE_VERSION) return;
    }
    const key = openModal(modalProps => (
        <WelcomeModal
            modalProps={modalProps}
            close={() => closeModal(key)}
            isFriend={RelationshipStore.isFriend(SQAAAKOI_USER_ID)}
        />
    ), {
        onCloseRequest: () => false
    });
}
