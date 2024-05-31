/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./InviteModal.css";

import { ModalRoot, ModalSize } from "@utils/modal";
import { findByCodeLazy, findByPropsLazy, findExportedComponentLazy } from "@webpack";
import { Forms } from "@webpack/common";

const { QRCodeWithOverlay } = findByPropsLazy("QRCodeWithOverlay");
const InviteCopyInput = findExportedComponentLazy("InviteCopyInput");
const linkify = findByCodeLazy("window.GLOBAL_ENV.INVITE_HOST", "/invite/");

export default function InviteModal({ props, invite }: { props: any; invite: any; }) {
    return <ModalRoot {...props} size={ModalSize.DYNAMIC}>
        <div className="vc-friend-invites-modal" >
            <QRCodeWithOverlay
                size={340}
                overlaySize={75}
                text={linkify(invite.code)}
            />
            <Forms.FormDivider className="vc-friend-invites-modal-divider" />
            <InviteCopyInput
                code={invite.code}
                copyValue={linkify(invite.code)}
                showFriends={false}
                modalState={{
                    maxAge: invite.maxAge,
                    maxUses: invite.maxUses,
                    networkError: null,
                    showVanityURL: false
                }}
            />
        </div>
    </ModalRoot>;
}
