import {getCurrentTab} from "./tabs.js"

async function navigateToHlZhCn() {
    const tab = await getCurrentTab()
    if (!tab) {
        return
    }
    const url = new URL(tab.url)
    const k = "hl"
    const v = "zh-CN"
    if (url.searchParams.has(k)) {
        url.searchParams.set(k, v)
    } else {
        url.searchParams.append(k, v)
    }
    chrome.tabs.create({
        url: url.toString()
    })
}

export const menu = {
    "menu": {
        "navigate": {
            "hlZhCn": navigateToHlZhCn
        }
    }
}