import * as parser from "./copy_info_parser.js"
import {TYPE_MARKDOWN_URL, TYPE_REFERENCE, TYPE_TITLE, TYPE_URL} from "./copy_info_parser.js"
import {getCurrentTab} from "./tabs.js"

const TAG_H = "h"
const TAG_ACTIVE_ELEMENT = "activeElement"


// region 复制相关

/** 复制标题 */
async function copyTitle() {
    await copy({
        type: TYPE_TITLE,
        title: true,
    })
}

/**
 * 复制标题的第一段
 *
 * 部门网址会使用 标题 | 网站 的形式作为标题
 * 因此第一段可以作为标题
 * 最后一段作为网站信息
 */
async function copyTitleFirst() {
    await copy({
        type: TYPE_TITLE,
        titleFirst: true,
    })
}

async function copyTitleLast() {
    await copy({
        type: TYPE_TITLE,
        titleLast: true,
    })
}

/**
 * 以 h 标签作为标题
 * 具体实现参阅 copy_script.js
 * 会尝试读取 h1、h2
 */
async function copyH() {
    await copy({
        type: TYPE_TITLE,
        h: true,
    })
}

/** 复制地址 */
async function copyUrl() {
    await copy({
        type: TYPE_URL,
        url: true,
    })
}

/** 复制标题和地址为 Markdown 链接 */
async function copyMarkdownTitleUrl() {
    await copy({
        type: TYPE_MARKDOWN_URL,
        title: true,
        url: true,
    })
}

async function copyMarkdownTitleFirstUrl() {
    await copy({
        type: TYPE_MARKDOWN_URL,
        titleFirst: true,
        url: true,
    })
}

async function copyMarkdownTitleLastUrl() {
    await copy({
        type: TYPE_MARKDOWN_URL,
        titleLast: true,
        url: true,
    })
}

async function copyMarkdownHUrl() {
    await copy({
        type: TYPE_MARKDOWN_URL,
        h: true,
        url: true,
    })
}

async function copyActiveElement() {
    // 复用 h 参数
    // 在 copy_script.js getCopyInfo 中获取
    // 在 getCopyInfoSuccess 中取值
    await sendGetCopyInfoMessage({
        type: TYPE_TITLE,
        tag: TAG_ACTIVE_ELEMENT,
        h: true,
    })
}

async function copy(
    {
        type,
        title = false,
        titleFirst = false,
        titleLast = false,
        h = false,
        url = true,
    }
) {
    const data = {
        type: type,
        title: title,
        titleFirst: titleFirst,
        titleLast: titleLast,
        h: h,
        url: url,
    }
    if (h) {
        data.tag = TAG_H
        await sendGetCopyInfoMessage(data)
    } else {
        // 不需要获取 h，直接处理
        await getCopyInfoSuccess(data)
    }
}

// endregion

// region 参考文献相关

/**
 * 尝试默认处理
 */
async function copyReferenceDefault() {
    const tab = await getCurrentTab()
    if (!tab) {
        return
    }

    const title = tab.title
    const titles = parser.splitTitle(title)
    if (titles.length >= 2) {
        // 如果标题可以分作两段以上
        await copyReferenceTitleLastTitleFirstUrl()
    } else {
        // 否则取 h、地址形式
        await copyReferenceHUrl()
    }
}

/**
 * `${title}. ${url}.`
 * `${titleLast}. ${url}.`
 * `${h}. ${url}.`
 * `${title}. ${h}. ${url}.`
 * `${titleLast}. ${h}. ${url}.`
 */
async function copyReferenceTitleUrl() {
    await copyReference({
        title: true,
    })
}

async function copyReferenceTitleLastUrl() {
    await copyReference({
        titleLast: true,
    })
}

async function copyReferenceHUrl() {
    await copyReference({
        h: true,
    })
}

async function copyReferenceTitleHUrl() {
    await copyReference({
        title: true,
        h: true,
    })
}

async function copyReferenceTitleLastHUrl() {
    await copyReference({
        titleLast: true,
        h: true,
    })
}

async function copyReferenceTitleLastTitleFirstUrl() {
    await copyReference({
        titleFirst: true,
        titleLast: true,
    })
}

async function copyReference(
    {
        title = false,
        titleFirst = false,
        titleLast = false,
        h = false,
        url = true,
    }
) {
    await copy(
        {
            type: TYPE_REFERENCE,
            title: title,
            titleFirst: titleFirst,
            titleLast: titleLast,
            h: h,
            url: url,
        }
    )
}


// endregion


// region 消息相关

/**
 * 因为 service_worker 不能操作 DOM
 *
 * 所以我们发送消息到 content_scripts
 * 在 copy_script.js 中接收消息，获取标题
 * 获取完以后，再通过消息发送回来进行处理
 */
async function sendGetCopyInfoMessage(data) {
    const tab = await getCurrentTab()
    if (!tab) {
        return
    }
    chrome.tabs.sendMessage(
        tab.id,
        {
            "id": "com.pingfangx.message.getCopyInfo",
            "data": data
        }
    )
}

function sendCopyMessage(tab, text) {
    if (!tab) {
        return
    }
    chrome.tabs.sendMessage(
        tab.id,
        {
            "id": "com.pingfangx.message.copy",
            "data": text
        }
    )
}

function registerCopyMenuMessageReceiver() {
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            switch (request.id) {
                case "com.pingfangx.message.getCopyInfoSuccess":
                    getCopyInfoSuccess(request.data)
                    break
                case "com.pingfangx.message.copySuccess":
                    showNotification(request.data)
                    break
                default:
                    break
            }
        }
    )
}

/**
 * 获取复制信息成功
 * 根据 data 中设置的信息，判断并进行处理
 */
async function getCopyInfoSuccess(data) {
    const result = data.result || ""

    const tab = await getCurrentTab()
    if (!tab) {
        return
    }

    const title = tab.title
    const url = tab.url
    let h = ""
    if (data.h) {
        if (data.hasOwnProperty("tag")) {
            if (data.tag === TAG_H || data.tag === TAG_ACTIVE_ELEMENT) {
                // 将结果置为 title
                h = result
            }
        }
    }
    let text
    if (data.type === TYPE_REFERENCE) {
        text = await parser.parseReference(title, h, url, data)
    } else {
        text = await parser.parseText(title, h, url, data)
    }
    if (text) {
        sendCopyMessage(tab, text)
    }
}


function showNotification(msg) {
    chrome.notifications.create(null, {
        "title": chrome.i18n.getMessage("background_notification_copy_success"),
        "message": msg,
        "iconUrl": "/images/icon128.png",
        "type": "basic"
    })
}

// endregion

export const menu = {
    "menu": {
        "copy": {
            "title": copyTitle,
            "titleFirst": copyTitleFirst,
            "titleLast": copyTitleLast,
            "h": copyH,
            "url": copyUrl,
            "markdownTitleUrl": copyMarkdownTitleUrl,
            "markdownTitleFirstUrl": copyMarkdownTitleFirstUrl,
            "markdownTitleLastUrl": copyMarkdownTitleLastUrl,
            "markdownHUrl": copyMarkdownHUrl,
            "activeElement": copyActiveElement,
        },
        "copyReference": {
            "default": copyReferenceDefault,
            "titleUrl": copyReferenceTitleUrl,
            "titleLastUrl": copyReferenceTitleLastUrl,
            "hUrl": copyReferenceHUrl,
            "titleHUrl": copyReferenceTitleHUrl,
            "titleLastHUrl": copyReferenceTitleLastHUrl,
            "titleLastTitleFirstUrl": copyReferenceTitleLastTitleFirstUrl,
        }
    }
}
export {registerCopyMenuMessageReceiver}