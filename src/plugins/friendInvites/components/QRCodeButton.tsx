/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./QRCodeButton.css";

import ErrorBoundary from "@components/ErrorBoundary";
import { ModalRoot, ModalSize, openModal } from "@utils/modal";
import { extractAndLoadChunksLazy, findByCodeLazy, findByPropsLazy } from "@webpack";
import { Button } from "@webpack/common";

const requireQRCode = extractAndLoadChunksLazy([".qrCodeButtonContent"]);
const { QRCodeWithOverlay } = findByPropsLazy("QRCodeWithOverlay");
const QRCodeIcon = findByCodeLazy("M1.8 1.8V6H6V1.8H1.8Zm3 3H3V3h1.8v1.8ZM1.8 12v4.2H6V12H1.8Zm3");

export default function QRCode(qr: any) {
    return <ErrorBoundary>
        <Button
            innerClassName="vc-friend-invites-qr-code-button"
            size={Button.Sizes.ICON}
            color={Button.Colors.TRANSPARENT}
            onClick={() => {
                requireQRCode().then(() => openModal(props => <ModalRoot {...props} size={ModalSize.DYNAMIC}>
                    <div style={{ margin: 16 }} >
                        <QRCodeWithOverlay {...qr} />
                    </div>
                </ModalRoot>));
            }}
        >
            <QRCodeIcon width={40} height={40} />
        </Button>
    </ErrorBoundary >;
}
