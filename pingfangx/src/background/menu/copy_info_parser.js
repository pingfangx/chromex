const TYPE_TITLE = 0b0001
const TYPE_URL = 0b0010
/** 后两者都需要标题和地址，所以低两位都是 1 */
const TYPE_MARKDOWN_URL = 0b0111
const TYPE_REFERENCE = 0b1011

const RULE_TYPE_ALL = "all"
const RULE_TYPE_TITLE = "title"
const RULE_TYPE_URL = "url"

/** 保存的配置 */
async function getConfig() {
    return new Promise((resolve, _) => {
        chrome.storage.sync.get(null, function (result) {
            resolve(result)
        })
    })
}

/** 保存的规则 */
async function getRuleConfigs() {
    const ruleTexts = await getConfig().rules
    const ruleConfigs = []
    if (!ruleTexts) {
        return ruleConfigs
    }

    const ruleLines = ruleTexts.split("\n")
    for (const ruleLine of ruleLines) {
        const split = ruleLine.split("|")
        if (split.length >= 3) {
            ruleConfigs.push({
                "type": split[0],
                "search": split[1],
                "replace": split[2]
            })
        } else if (split.length >= 2) {
            ruleConfigs.push({
                "type": "all",
                "search": split[0],
                "replace": split[1]
            })
        }
    }
    return ruleConfigs
}

function handleTextByRuleConfig(ruleConfig, text) {
    text = text.replace(ruleConfig.search, ruleConfig.replace)
    text = text.replace(new RegExp(ruleConfig.search), ruleConfig.replace)
    return text
}

function handleTextByRuleConfigs(ruleConfigs, text, targetType) {
    for (const ruleConfig of ruleConfigs) {
        if (ruleConfig.type === targetType) {
            text = handleTextByRuleConfig(ruleConfig, text)
        }
    }
    return text
}

async function parseText(title, h, url, data) {
    const ruleConfigs = await getRuleConfigs()

    const type = data.type
    if (data.h) {
        // 在该场景中直接将 h 赋给 title 方便后续统一处理
        title = h
    } else if (data.titleFirst) {
        const titles = splitTitle(title)
        title = titles[0]
    } else if (data.titleLast) {
        const titles = splitTitle(title)
        title = titles[titles.length - 1]
    }
    title = processTitle(title)

    if ((type & TYPE_TITLE) !== 0) {
        // 需要处理标题
        title = handleTextByRuleConfigs(ruleConfigs, title, RULE_TYPE_TITLE)
    }
    if ((type & TYPE_URL) !== 0) {
        // 需要处理地址
        url = handleTextByRuleConfigs(ruleConfigs, url, RULE_TYPE_URL)
    }

    switch (type) {
        case TYPE_TITLE:
            return handleTextByRuleConfigs(ruleConfigs, title, RULE_TYPE_ALL)
        case TYPE_URL:
            return handleTextByRuleConfigs(ruleConfigs, url, RULE_TYPE_ALL)
        case TYPE_MARKDOWN_URL:
            const text = `[${title}](${url})`
            return handleTextByRuleConfigs(ruleConfigs, text, RULE_TYPE_ALL)
        default:
            break
    }
    return ""
}

async function parseReference(title, h, url, data) {
    const config = await getConfig()
    const ruleConfigs = config.rules
    let text = ""
    if (data.title) {
        text += processTitleAndAddDot(ruleConfigs, title)
    }
    if (data.titleLast) {
        const titles = splitTitle(title)
        const titleLast = titles[titles.length - 1]
        text += processTitleAndAddDot(ruleConfigs, titleLast)
    }
    if (data.titleFirst) {
        // 只有极少数情况会同时需要 first 和 last
        // first 一般表示标题，last 表示网站
        // 用来表示参考文献，网站在前标题在后，所以先添加 last，再添加 first
        const titles = splitTitle(title)
        const titleFirst = titles[0]
        text += processTitleAndAddDot(ruleConfigs, titleFirst)
    }
    if (data.h) {
        text += processTitleAndAddDot(ruleConfigs, h)
    }

    if (config.includeReferenceType) {
        // 包含引用类型
        if (text.endsWith(". ")) {
            text = text.substring(0, text.length - 2)
        }
        text += `[EB/OL]. `
    }
    if (config.includeReferenceDate) {
        // 包含引用日期
        const d = new Date()
        const year = d.getFullYear()
        const month = (d.getMonth() + 1).toString().padStart(2, "0")
        const day = d.getDate().toString().padStart(2, "0")
        text += `[${year}-${month}-${day}]. `
    }

    if (data.url) {
        text += handleTextByRuleConfigs(ruleConfigs, url, RULE_TYPE_URL)
        text += ". "
    }
    // 因为都是加的 ". " 所以需移除最后的空格
    text = text.trim()
    text = handleTextByRuleConfigs(ruleConfigs, text, RULE_TYPE_ALL)
    return text
}

function processTitleAndAddDot(ruleConfigs, title) {
    let text = processTitle(title) + ". "
    text = handleTextByRuleConfigs(ruleConfigs, text, RULE_TYPE_TITLE)
    return text
}

/**
 * 将标题划分，用来提供 titleFirst titleLast 等
 * @param title 标题
 * @return string[]
 */
function splitTitle(title) {
    let titles
    if (title.includes("|")) {
        titles = title.split("|")
    } else if (title.includes("-")) {
        titles = title.split("-")
    } else {
        titles = [title]
    }
    for (let i = 0; i < titles.length; i++) {
        titles[i] = titles[i].trim()
    }
    return titles
}

function processTitle(title) {
    title = title.trim()
    return title.replace("\uFEFF", "") // ZERO WIDTH NO-BREAK SPACE
}

export {TYPE_TITLE, TYPE_URL, TYPE_MARKDOWN_URL, TYPE_REFERENCE}
export {parseText, parseReference, splitTitle}