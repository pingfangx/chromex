/** 翻译 */
function translate(e, url) {
    if (e.selectionText) {
        chrome.tabs.create({
            "url": url + e.selectionText
        })
    }
}

/** 谷歌翻译 */
function translateByGoogle(e) {
    translate(e, "https://translate.google.cn/#en/zh-CN/")
}

/** 百度翻译 */
function translateByBaidu(e) {
    translate(e, "https://fanyi.baidu.com/#en/zh/")
}

export const menu = {
    "menu": {
        "translate": {
            "google": {
                "contexts": ["selection"],
                "onclick": translateByGoogle
            },
            "baidu": {
                "contexts": ["selection"],
                "onclick": translateByBaidu
            },
            "contexts": ["selection"],
        }
    }
}