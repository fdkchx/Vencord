/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DataStore } from "@api/index";
import { closeModal, ModalContent, ModalFooter, ModalHeader, ModalProps, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { extractAndLoadChunksLazy, findLazy } from "@webpack";
import { Button, Flex, Parser, RelationshipStore, Text, useEffect, useState } from "@webpack/common";

import { CURRENT_WELCOME_NOTICE_VERSION, SQAAAKOI_USER_ID, WELCOME_BACK_HEADER, WELCOME_HEADER, WELCOME_MESSAGE, WELCOME_NOTICE_VERSION_KEY } from "./constants";

const contentClass = findLazy(m => m.modal && m.content && Object.keys(m).length === 2);
// must be called before rendering
export const requireContentClass = extractAndLoadChunksLazy(["hasAnyModalOpen)())&&(0,"]);

// First time run card
export function WelcomeModal({ modalProps, close, isFriend, force, welcomeBack, text }: { modalProps: ModalProps; close: () => void; isFriend: boolean; force: boolean; welcomeBack: boolean; text: string; }) {
    const [unlocked, setUnlocked] = useState(force);
    const [closing, setClosing] = useState(false);
    useEffect(() => {
        setTimeout(() => setUnlocked(true), (isFriend ? 5000 : 15000) + ((Math.random() - 0.5) * 5));
    });

    if (closing && unlocked) {
        close();
        DataStore.set(WELCOME_NOTICE_VERSION_KEY, CURRENT_WELCOME_NOTICE_VERSION);
    }


    return <ModalRoot {...modalProps} size={ModalSize.MEDIUM} >
        <ModalHeader>
            <Text variant="heading-lg/semibold" style={{ flexGrow: 1, textAlign: "center" }}>{welcomeBack ? WELCOME_BACK_HEADER : WELCOME_HEADER}</Text>
        </ModalHeader>
        <ModalContent>
            <div className={contentClass.content}>
                {Parser.reactParserFor(defaultRules)(text, false)}
            </div>
        </ModalContent>
        <ModalFooter>
            <Flex flexDirection="row">
                {/* <Forms.FormTitle>Run /welcome-modal to open this later</Forms.FormTitle> */}
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
    await requireContentClass();
    const isFriend = RelationshipStore.isFriend(SQAAAKOI_USER_ID);
    const key = openModal(modalProps => (
        <WelcomeModal
            modalProps={modalProps}
            close={() => closeModal(key)}
            isFriend={isFriend}
            force={force}
            welcomeBack={currentVersion === 0 || force}
            text={WELCOME_MESSAGE(isFriend)}
        />
    ), {
        onCloseRequest: () => false
    });
}
