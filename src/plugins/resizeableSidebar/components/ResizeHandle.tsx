/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./ResizeHandle.css";

import { classes } from "@utils/misc";
import { findByPropsLazy } from "@webpack";

import { settings } from "..";

const { default: createResizeHandler, ResizeOrientation } = findByPropsLazy("ResizeOrientation");

const styles = findByPropsLazy("resizeHandle", "chatLayerWrapper");

const saveWidth = (width: number) => { settings.store.width = width; };

export default function ResizeHandle({ node }: { node: React.MutableRefObject<any>; }) {
    const resizeHandler = createResizeHandler({
        minDimension: 0,
        maxDimension: 768,
        resizableDomNodeRef: node,
        onElementResize: saveWidth,
        onElementResizeEnd: () => { },
        orientation: ResizeOrientation.HORIZONTAL_RIGHT
    });
    return <div className="vc-resizeable-sidebar-handle-wrapper">
        <div
            onMouseDown={resizeHandler}
            onContextMenu={() => {
                node.current.style.width = "";
                setImmediate(() => saveWidth(-1));
            }}
            className={classes("vc-resizeable-sidebar-handle", styles.resizeHandle)}
        />
    </div>;
}
