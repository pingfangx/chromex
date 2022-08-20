const TAG_H = "h"
const TAG_ACTIVE_ELEMENT = "activeElement"
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        switch (request.id) {
            case "com.pingfangx.message.getCopyInfo":
                getCopyInfo(request.data)
                break
            case "com.pingfangx.message.copy":
                copyToClipboard(request.data)
                break
            default:
                break
        }
    }
)

/** 获取复制信息 */
function getCopyInfo(copyInfo) {
    let element
    if (copyInfo.hasOwnProperty("tag")) {
        const tag = copyInfo.tag
        if (tag === TAG_H) {
            for (let i = 1; i < 3; i++) {
                const elements = document.getElementsByTagName(`h${i}`)
                if (elements) {
                    element = elements[0]
                    if (element) {
                        break
                    }
                }
            }
        } else if (tag === TAG_ACTIVE_ELEMENT) {
            element = document.activeElement
        }
        if (!element) {
            console.warn(`element is empty, tag = ${tag}`)
        }
    }
    if (element) {
        copyInfo["result"] = element.innerText
        chrome.runtime.sendMessage(
            {
                "id": "com.pingfangx.message.getCopyInfoSuccess",
                "data": copyInfo
            }
        )
    }
}

/**
 * service_worker 不能获取 document
 * 因此使用 content_scripts 向 <all_urls> 注入该脚本
 * 从 service_worker 中发送消息，该脚本中收到消息进行处理
 */
function copyToClipboard(text) {
    if (!text) {
        return
    }
    const textarea = document.createElement("textarea")
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand("copy")
    document.body.removeChild(textarea)

    chrome.runtime.sendMessage(
        {
            "id": "com.pingfangx.message.copySuccess",
            "data": text
        }
    )
}