/**
 * ----------------------------------------------------------------
 * Base 4 加密/解密逻辑
 * 符号：是 (0), 你 (1), 奶奶 (2), ！ (3)
 * Base 256 <-> Base 4 转换
 * ----------------------------------------------------------------
 */

// 密文符号集 (对应 0, 1, 2, 3)
const ENCRYPT_MAPPING = ["是", "你", "奶奶", "！"];

// 密文符号到数字的逆向映射
const DECRYPT_MAPPING = new Map([
    ["是", 0],
    ["你", 1],
    ["奶奶", 2],
    ["！", 3]
]);

// 进制基数：BigInt(4)
const BASE = 4n; 

/**
 * 【私有方法】将 BigInt D 转换为四进制符号密文
 * @param {bigint} number - 待转换的大整数
 * @returns {string} 密文
 */
function bigIntToBase4Cipher(number) {
    if (number === 0n) {
        return ENCRYPT_MAPPING[0]; // 对应 BigInteger.ZERO 的特殊处理
    }

    let ciphertextBuilder = "";
    let tempNumber = number;

    while (tempNumber > 0n) {
        // 取余数 (0, 1, 2, or 3)
        const remainder = Number(tempNumber % BASE);

        // 将余数映射为密文符号，并插入到结果字符串的最前面
        ciphertextBuilder = ENCRYPT_MAPPING[remainder] + ciphertextBuilder;

        // D = D / 4
        tempNumber /= BASE;
    }

    return ciphertextBuilder;
}

/**
 * 【私有方法】将四进制符号密文转换为 BigInt D
 * @param {string} ciphertext - 密文
 * @returns {bigint} 大整数 D
 */
function base4CipherToBigInt(ciphertext) {
    let number = 0n;
    let i = 0;

    while (i < ciphertext.length) {
        let symbol = null;
        let value = null;

        // 1. 优先检查双字符符号 "奶奶"
        if (i + 2 <= ciphertext.length && ciphertext.substring(i, i + 2) === "奶奶") {
            symbol = "奶奶";
            value = DECRYPT_MAPPING.get("奶奶");
        } else {
            // 2. 检查单字符符号 "是", "你", "！"
            const charStr = ciphertext.charAt(i);
            value = DECRYPT_MAPPING.get(charStr);
            if (value !== undefined) {
                symbol = charStr;
            }
        }

        if (value === undefined) {
            // 🚨 遇到非法字符，抛出异常或返回错误信息
            const err = getCurrentLang() === 'zh'
                ? `解密失败：密文中包含非法符号在位置 ${i}`
                : `Decryption failed: invalid symbol at index ${i}`;
            throw new Error(err);
        }

        // D = D * BASE + value
        // BigInt(value) 将数字转为 BigInt，以便进行 BigInt 运算
        number = number * BASE + BigInt(value);

        // 更新索引
        i += symbol.length; // "奶奶" 移动 2 位，其他符号移动 1 位
    }

    return number;
}


// =========================================================================
// 公共接口：绑定到 HTML 按钮
// =========================================================================

/**
 * 将任意明文加密为由 "是", "你", "奶奶", "！" 构成的密文。
 * 流程：明文(UTF-8) -> 字节数组 -> BigInt D -> 四进制字符串 -> 密文。
 */
function handleEncrypt() {
    try {
        const plaintext = document.getElementById('userInput').value;
        const output = document.getElementById('outputDisplay');

        if (!plaintext) {
            output.value = "";
            return;
        }

        // 1. 明文转字节数组（Uint8Array - UTF-8）
        const encoder = new TextEncoder();
        const bytes = encoder.encode(plaintext);

        // 2. 字节数组转 BigInt D (Base-256)
        // 模拟 Java BigInteger 构造函数，需要将字节流视为一个大数字。
        let number = 0n;
        
        // 我们从高位（左侧）字节开始累加，相当于 D = D * 256 + byteValue
        for (const byte of bytes) {
            number = number * 256n + BigInt(byte);
        }

        // 3. BigInt D 转四进制并映射到密文符号
        output.value = bigIntToBase4Cipher(number);

    } catch (e) {
        const prefix = getCurrentLang() === 'zh' ? "加密出错：" : "Encryption error: ";
        document.getElementById('outputDisplay').value = prefix + e.message;
        console.error("加密错误:", e);
    }
}

/**
 * 将由 "是", "你", "奶奶", "！" 构成的密文解密回明文。
 * 流程：密文 -> 四进制字符串 -> BigInt D -> 字节数组 -> 明文(UTF-8)。
 */
function handleDecrypt() {
    try {
        const ciphertext = document.getElementById('userInput').value;
        const output = document.getElementById('outputDisplay');

        if (!ciphertext) {
            output.value = "";
            return;
        }

        // 1. 密文符号转 BigInt D
        const number = base4CipherToBigInt(ciphertext);

        // 2. BigInt D 转字节数组 (Base-256)
        // D 到 Base 256 的转换：类似加密的逆过程
        const byteValues = [];
        let tempNumber = number;

        if (tempNumber === 0n) {
            // 如果数字是 0，说明原始输入是空（虽然不太可能，但保险起见）
            output.value = "";
            return;
        }

        while (tempNumber > 0n) {
            // 取余数 (0-255)
            const remainder = Number(tempNumber % 256n);
            byteValues.unshift(remainder); // 从低位到高位，所以要插在数组头部

            // D = D / 256
            tempNumber /= 256n;
        }
        
        // 3. 字节数组转明文
        const bytes = new Uint8Array(byteValues);
        const decoder = new TextDecoder('utf-8');
        output.value = decoder.decode(bytes);

    } catch (e) {
        document.getElementById('outputDisplay').value = e.message;
        console.error("解密错误:", e);
    }
}

/**
 * 复制输出并显示提示（按钮震动 + 屏幕弹窗）
 */
function copyOutput() {
    const output = document.getElementById('outputDisplay');
    const text = output ? output.value : '';

    const copyPromise = (navigator.clipboard && navigator.clipboard.writeText)
        ? navigator.clipboard.writeText(text)
        : new Promise((resolve, reject) => {
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.left = '-9999px';
                document.body.appendChild(ta);
                ta.select();
                /** @type {any} */ (document).execCommand('copy');
                document.body.removeChild(ta);
                resolve();
            } catch (e) {
                reject(e);
            }
        });

    copyPromise.then(() => {
        doShakeButtonById('copyButton');
        showToastMsg(getCurrentLang() === 'zh' ? '已成功复制到剪贴板' : 'Successfully copied to clipboard');
    }).catch((e) => {
        console.error('Copy failed', e);
        showToastMsg(getCurrentLang() === 'zh' ? '复制失败' : 'Copy failed');
    });
}

// 通用：按钮震动（通过 id）
function doShakeButtonById(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    btn.classList.add('shake');
    setTimeout(() => btn.classList.remove('shake'), 400);
}

// 通用：屏幕提示
function showToastMsg(msg) {
    const toast = document.getElementById('copyToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1600);
}

// 粘贴功能：尝试从剪贴板读取文本并插入光标处（若不支持则提示）
async function pasteInput() {
    const input = document.getElementById('userInput');
    if (!input) return;

    try {
        if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            if (text !== undefined && text !== null && text !== '') {
                const start = input.selectionStart != null ? input.selectionStart : input.value.length;
                const end = input.selectionEnd != null ? input.selectionEnd : input.value.length;
                input.value = input.value.slice(0, start) + text + input.value.slice(end);
                input.focus();
                input.selectionStart = input.selectionEnd = start + text.length;
                doShakeButtonById('pasteButton');
                showToastMsg(getCurrentLang() === 'zh' ? '已从剪贴板粘贴' : 'Pasted from clipboard');
            } else {
                doShakeButtonById('pasteButton');
                showToastMsg(getCurrentLang() === 'zh' ? '剪贴板为空' : 'Clipboard empty');
            }
        } else {
            showToastMsg(getCurrentLang() === 'zh' ? '不支持自动粘贴，请按 Ctrl/Cmd+V' : 'Paste not supported; press Ctrl/Cmd+V inside the input');
        }
    } catch (e) {
        console.error('Paste failed', e);
        showToastMsg(getCurrentLang() === 'zh' ? '粘贴失败' : 'Paste failed');
    }
}

// 清空输入
function clearInput() {
    const input = document.getElementById('userInput');
    if (!input) return;
    input.value = '';
    doShakeButtonById('clearButton');
    showToastMsg(getCurrentLang() === 'zh' ? '已清空输入' : 'Cleared input');
}

// 动态计算并设置按钮位置（确保按钮完全位于对应的 textarea 内部）
function positionButtonsInsideTextareas() {
    try {
        // 输出区域 Copy 按钮
        const outWrapper = document.querySelector('.output-wrapper');
        const outTA = document.getElementById('outputDisplay');
        const copyBtn = document.getElementById('copyButton');
        if (outWrapper && outTA && copyBtn) {
            const top = outTA.offsetTop + 8; // 文字框内靠下偏移
            const right = Math.max(8, outWrapper.clientWidth - (outTA.offsetLeft + outTA.clientWidth) + 12);
            const SHIFT_RIGHT = 4; // 向左微调，避免紧贴圆角
            copyBtn.style.top = `${top}px`;
            copyBtn.style.right = `${right + SHIFT_RIGHT}px`;

            // 微调：如果按钮超出 textarea 底部，则向上移动
            const taRect = outTA.getBoundingClientRect();
            const btnRect = copyBtn.getBoundingClientRect();
            if (btnRect.bottom > taRect.bottom - 4) {
                const delta = btnRect.bottom - taRect.bottom + 4;
                copyBtn.style.top = `${top - delta}px`;
            }
        }

        // 输入区域 Paste / Clear 按钮
        const inWrapper = document.querySelector('.input-wrapper');
        const inTA = document.getElementById('userInput');
        const clearBtn = document.getElementById('clearButton');
        const pasteBtn = document.getElementById('pasteButton');
        if (inWrapper && inTA && clearBtn && pasteBtn) {
            const top = inTA.offsetTop + 8;
            const rightBase = Math.max(8, inWrapper.clientWidth - (inTA.offsetLeft + inTA.clientWidth) + 12);

            // 将 clear 放在右侧，paste 在其左侧，保留间隙，整体向左微调
            const gap = 8;
            const SHIFT_RIGHT_INPUT = 4; // 正值使按钮向左偏移，留出舒适间距
            const clearRight = rightBase + SHIFT_RIGHT_INPUT;
            const pasteRight = clearRight + clearBtn.offsetWidth + gap;

            clearBtn.style.top = `${top}px`;
            clearBtn.style.right = `${clearRight}px`;
            pasteBtn.style.top = `${top}px`;
            pasteBtn.style.right = `${pasteRight}px`;

            // 微调：如果按钮超出 textarea 底部，则向上移动
            const taRect = inTA.getBoundingClientRect();
            const cbRect = clearBtn.getBoundingClientRect();
            const pbRect = pasteBtn.getBoundingClientRect();
            let adjust = 0;
            if (cbRect.bottom > taRect.bottom - 4) adjust = Math.max(adjust, cbRect.bottom - taRect.bottom + 4);
            if (pbRect.bottom > taRect.bottom - 4) adjust = Math.max(adjust, pbRect.bottom - taRect.bottom + 4);
            if (adjust > 0) {
                clearBtn.style.top = `${top - adjust}px`;
                pasteBtn.style.top = `${top - adjust}px`;
            }
        }
    } catch (e) {
        console.error('positionButtonsInsideTextareas error:', e);
    }
}

// 在加载和窗口大小变化时重新计算位置
window.addEventListener('DOMContentLoaded', () => setTimeout(positionButtonsInsideTextareas, 50));
window.addEventListener('resize', () => setTimeout(positionButtonsInsideTextareas, 50));

// 也在交互后（如粘贴、清空、复制）重新计算以防布局变化
const observeButtons = ['copyButton', 'pasteButton', 'clearButton'];
observeButtons.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('transitionend', positionButtonsInsideTextareas);
});

// =========================================================================
// 国际化 (i18n) 语言支持（同步主站 language 设置）
// =========================================================================

function getCurrentLang() {
    try {
        const stored = localStorage.getItem('language');
        if (stored === 'zh' || stored === 'en') return stored;
    } catch (e) {}
    return 'en';
}

function setLanguage(lang) {
    try {
        localStorage.setItem('language', lang);
    } catch (e) {}

    document.documentElement.lang = (lang === 'zh') ? 'zh-CN' : 'en';

    // 页面标题
    document.title = (lang === 'zh') ? '是你奶奶！' : 'Granny Translator';

    // 文本内容切换 (匹配 data-zh)
    document.querySelectorAll('[data-zh]').forEach(el => {
        if (!el.hasAttribute('data-en')) el.dataset.en = el.textContent || '';
        el.textContent = (lang === 'zh') ? el.dataset.zh : el.dataset.en;
    });

    // placeholder 属性切换 (匹配 data-placeholder-zh)
    document.querySelectorAll('[data-placeholder-zh]').forEach(el => {
        if (!el.hasAttribute('data-placeholder-en')) {
            el.dataset.placeholderEn = el.getAttribute('placeholder') || '';
        }
        el.setAttribute('placeholder', (lang === 'zh') ? el.dataset.placeholderZh : el.dataset.placeholderEn);
    });

    // 切换按钮自身文字
    const langBtn = document.getElementById('langToggle');
    if (langBtn) {
        langBtn.textContent = (lang === 'zh') ? 'EN' : '中文';
        langBtn.title = (lang === 'zh') ? 'Switch to English' : '切换为中文';
    }

    // 重新校准输入框内按钮位置
    setTimeout(positionButtonsInsideTextareas, 40);
}

function toggleLanguage() {
    const nextLang = (getCurrentLang() === 'zh') ? 'en' : 'zh';
    setLanguage(nextLang);
}

// 脚本加载即刻初始化，并在 DOM 完全挂载时复验
setLanguage(getCurrentLang());
window.addEventListener('DOMContentLoaded', () => {
    setLanguage(getCurrentLang());
    setTimeout(positionButtonsInsideTextareas, 50);
});