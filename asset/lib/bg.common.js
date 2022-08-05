import ip from "./ip.js"
import "./psl.js"

export default (() => {

    /**
     * <b>获取指定URL的Cookie</b>
     *
     * @param url
     * @returns {Promise<chrome.cookies.Cookie[]>}
     */
    async function getCookies(url) {
        let hostname = new URL(url).hostname;
        let details = {};
        if (ip.test(hostname)) {
            details.url = url;
        } else {
            let domain = psl.get(hostname);
            if (domain) {
                details.domain = domain;
            } else {
                details.url = url;
            }
        }

        return await chrome.cookies.getAll(details);
    }

    /**
     * <b>获取当前活动的Tab页</b>
     *
     * <p>注意：排除非http和https协议</p>
     * @returns {Promise<chrome.tabs.Tab>}
     */
    async function getCurrentTab(anyUrl = false) {
        let queryOptions = {
            active: true,
            lastFocusedWindow: true,
            url: ["http://*/*", "https://*/*"]
        };

        if (anyUrl) {
            queryOptions.url = null;
        }

        let [tab] = await chrome.tabs.query(queryOptions);
        return tab;
    }

    /**
     * <b>获取快捷键</b>
     *
     * @returns {Promise<String>}
     */
    async function getShortKey() {
        return chrome.runtime.getPlatformInfo().then((platformInfo) => {
            let shortKey = "Ctrl+Shift+L";
            if (platformInfo.os === "mac") {
                shortKey = "Command+Shift+L";
            }
            return new Promise((resolve) => resolve(shortKey));
        });
    }

    return {
        getCurrentTab: getCurrentTab,
        getCookies: getCookies,
        getShortKey: getShortKey,
    };
})();