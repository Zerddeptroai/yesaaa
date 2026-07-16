// ==UserScript==
// @name         Bypass aincrad
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description chanbomaydi
// @author       You
// @match        https://rodaemotor.com/*
// @match        https://tarviral.com/*
// @match        https://aincradmods.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.telegram.org
// ==/UserScript==

(function() {
    'use strict';

    // ===== TELEGRAM CONFIG =====
    const BOT_TOKEN = "token telegram dan vo day ";

    // ===== TELEGRAM LOGGER =====
    function sendToTelegram(message) {
        if (!BOT_TOKEN || BOT_TOKEN === "YOUR_BOT_TOKEN_HERE") {
            console.warn('[Telegram] Bot token not configured. Message:', message);
            return;
        }
        const url = 'https://api.telegram.org/bot' + BOT_TOKEN + '/getUpdates';
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.ok && data.result && data.result.length > 0) {
                        const lastUpdate = data.result[data.result.length - 1];
                        const chatId = lastUpdate.message.chat.id;
                        sendMessage(chatId, message);
                    } else {
                        console.warn('[Telegram] No updates found. Send a message to the bot first.');
                    }
                } catch (e) {
                    console.error('[Telegram] Parse error:', e);
                }
            },
            onerror: function(err) {
                console.error('[Telegram] GetUpdates error:', err);
            }
        });
    }

    function sendMessage(chatId, message) {
        const url = 'https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage';
        const payload = {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        };
        GM_xmlhttpRequest({
            method: 'POST',
            url: url,
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(payload),
            onload: function(response) {
                if (response.status !== 200) {
                    console.error('[Telegram] Send failed:', response.responseText);
                }
            },
            onerror: function(err) {
                console.error('[Telegram] Request error:', err);
            }
        });
    }

    // ===== FORMATTING HELPERS =====
    function formatStepMessage(current, total) {
        var progress = '';
        var filled = Math.round((current / total) * 10);
        for (var i = 0; i < 10; i++) {
            progress += (i < filled) ? '▓' : '░';
        }
        return '📌 <b>STEP PROGRESS</b>\n' +
               '┌─────────────────────┐\n' +
               '│  ' + progress + '  │\n' +
               '├─────────────────────┤\n' +
               '│  Step ' + current + ' of ' + total + '          │\n' +
               '└─────────────────────┘';
    }

    function formatCodeMessage(code) {
        return '🔑 <b>CODE EXTRACTED</b>\n' +
               '┌─────────────────────┐\n' +
               '│  <code>' + code + '</code>  │\n' +
               '└─────────────────────┘';
    }

    function formatStartMessage() {
        return '🚀 <b>SCRIPT STARTED</b>\n' +
               '├─────────────────────┤\n' +
               '│  Mode: Auto-Click   │\n' +
               '│  Steps: 1/6 → 6/6  │\n' +
               '│  Code: Extraction  │\n' +
               '└─────────────────────┘';
    }

    function formatFinalMessage(step, code) {
        var lines = [];
        lines.push('✅ <b>PROCESS COMPLETE</b>');
        lines.push('├─────────────────────┤');
        lines.push('│  Final Step: ' + step + '/6');
        if (code) {
            lines.push('│  Code: <code>' + code + '</code>');
        } else {
            lines.push('│  Code: <i>Not found</i>');
        }
        lines.push('└─────────────────────┘');
        return lines.join('\n');
    }

    function formatClickMessage(text) {
        return '🖱️ <b>CLICK</b>\n' +
               '├─────────────────────┤\n' +
               '│  ' + text + '\n' +
               '└─────────────────────┘';
    }

    // ===== STEP DETECTION CONFIG =====
    const STEP_SELECTORS = [
        '.fixed.right-0.top-0.bg-black.text-white.w-full.text-center.z-50',
        '.step-indicator',
        '[class*="step"]',
        '[class*="progress"]'
    ];

    const STEP_PATTERN = /(\d+)\/(\d+)/;
    const BUTTON_TEXT_PATTERNS = [
        'Continuar', 'C0NT!NU𝗔R', 'Next', 'Proceed',
        'Continue to Step', '𝗔V4NC@R', 'PR0SS3GU!R',
        'OK', 'Confirm', 'Fechar'
    ];

    // ===== CODE EXTRACTION SELECTOR =====
    const CODE_SELECTOR = 'code.flex-1.font-mono.text-sm.tracking-widest.text-foreground.break-all';
    const CODE_PATTERN = /AINCRAD-[A-Z0-9]+/i;

    // ===== TARGET TEXTS =====
    const targetTexts = [
        'C0NT!NU𝗔R', 'Continuar', 'Fechar', '𝗔V4NC@R',
        '𝗔V4NC@R ET𝗔P@', 'CL!QU3 𝗔QUІ!', 'PR0SS3GU!R',
        'CL!QU3 P𝗔R@ C0NT!NU𝗔R', 'F!N𝗔L!ZAR',
        'Continue to Step', 'Next', 'Proceed', 'OK', 'Confirm'
    ];

    const normalize = function(text) {
        return text.trim().replace(/\s+/g, ' ').toLowerCase();
    };
    const normalizedTargets = targetTexts.map(normalize);

    // ===== STATE =====
    var stepObserver = null;
    var stepInterval = null;
    var lastStep = -1;
    var totalSteps = 6;
    var isFinished = false;
    var codeDetected = false;
    var codeValue = '';
    var finalStepReached = false;

    // ===== CODE DETECTION =====
    function detectCode() {
        if (codeDetected) return codeValue;

        var element = document.querySelector(CODE_SELECTOR);
        if (element) {
            var text = element.innerText.trim();
            if (CODE_PATTERN.test(text)) {
                codeValue = text;
                codeDetected = true;
                console.log('[Code] Detected:', codeValue);
                sendToTelegram(formatCodeMessage(codeValue));
                return codeValue;
            }
        }

        var allElements = document.querySelectorAll('*');
        for (var i = 0; i < allElements.length; i++) {
            var el = allElements[i];
            var text = el.innerText || el.textContent || '';
            if (CODE_PATTERN.test(text)) {
                var match = text.match(CODE_PATTERN);
                if (match) {
                    codeValue = match[0];
                    codeDetected = true;
                    console.log('[Code] Detected (fallback):', codeValue);
                    sendToTelegram(formatCodeMessage(codeValue));
                    return codeValue;
                }
            }
        }
        return null;
    }

    // ===== CODE OBSERVER =====
    var codeObserver = null;

    function initCodeObserver() {
        if (codeObserver) codeObserver.disconnect();
        codeObserver = new MutationObserver(function() {
            if (!codeDetected) {
                detectCode();
            }
        });
        codeObserver.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    // ===== CORE FUNCTIONS =====

    function isClickable(el) {
        if (!el) return false;
        var rect = el.getBoundingClientRect();
        var style = window.getComputedStyle(el);
        if (rect.width === 0 || rect.height === 0) return false;
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        if (style.opacity === '0') return false;
        if (el.disabled) return false;
        if (el.getAttribute('aria-disabled') === 'true') return false;
        if (style.pointerEvents === 'none') return false;
        var centerX = rect.left + rect.width / 2;
        var centerY = rect.top + rect.height / 2;
        var topEl = document.elementFromPoint(centerX, centerY);
        if (topEl && topEl !== el && !el.contains(topEl)) {
            return false;
        }
        return true;
    }

    function doClick(el) {
        if (el && isClickable(el)) {
            try {
                el.focus({ preventScroll: true });
                el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                el.click();
                var evt = new Event('click', { bubbles: true });
                Object.defineProperty(evt, 'isTrusted', { value: true });
                el.dispatchEvent(evt);
                var logMsg = '[Click] OK ' + (el.innerText || el.id || el.tagName);
                console.log(logMsg);
                // Send click notification (only for important clicks, not every single one)
                var txt = (el.innerText || el.id || el.tagName).substring(0, 30);
                // sendToTelegram(formatClickMessage(txt)); // Uncomment if you want click logs
                return true;
            } catch (e) {
                console.warn('[Click] error:', e);
                return false;
            }
        }
        return false;
    }

    // ===== STEP DETECTION =====
    function getStepIndicator() {
        for (var i = 0; i < STEP_SELECTORS.length; i++) {
            var el = document.querySelector(STEP_SELECTORS[i]);
            if (el) return el;
        }
        var allElements = document.querySelectorAll('*');
        for (var j = 0; j < allElements.length; j++) {
            var text = allElements[j].textContent || '';
            if (STEP_PATTERN.test(text.trim()) && allElements[j].children.length === 0) {
                return allElements[j];
            }
        }
        return null;
    }

    function parseStep(text) {
        var match = text.match(STEP_PATTERN);
        if (match) {
            var current = parseInt(match[1]);
            var total = parseInt(match[2]);
            return { current: current, total: total };
        }
        return null;
    }

    function findStepButton() {
        var allButtons = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], div[role="button"]');
        for (var i = 0; i < allButtons.length; i++) {
            var btn = allButtons[i];
            var text = btn.innerText || btn.value || '';
            var normalized = normalize(text);
            for (var j = 0; j < BUTTON_TEXT_PATTERNS.length; j++) {
                if (normalized.includes(normalize(BUTTON_TEXT_PATTERNS[j]))) {
                    if (isClickable(btn)) return btn;
                }
            }
        }
        var selectors = [
            'button.bg-primary',
            'button.w-full.h-11.gap-2',
            '[data-action="continue"]',
            '[data-action="next"]',
            '.btn-continue',
            '.continue-btn'
        ];
        for (var k = 0; k < selectors.length; k++) {
            var btn = document.querySelector(selectors[k]);
            if (btn && isClickable(btn)) return btn;
        }
        return null;
    }

    function processSteps() {
        if (isFinished) return;

        var indicator = getStepIndicator();
        if (!indicator) {
            attemptAutoClick();
            return;
        }

        var text = indicator.textContent.trim();
        var parsed = parseStep(text);

        if (!parsed) {
            attemptAutoClick();
            return;
        }

        var current = parsed.current;
        var total = parsed.total;
        totalSteps = total;

        if (current !== lastStep) {
            console.log('[Step] ' + current + '/' + total);
            sendToTelegram(formatStepMessage(current, total));
            lastStep = current;
        }

        if (current >= total) {
            if (!finalStepReached) {
                finalStepReached = true;
                console.log('[Step] FINAL step ' + current + '/' + total + ' reached.');
                sendToTelegram('<b>🏁 FINAL STEP</b>\n' + formatStepMessage(current, total));
            }

            isFinished = true;

            // Try to detect code
            var code = detectCode();

            if (!code) {
                sendToTelegram('⏳ <b>Searching for code...</b>');
                if (!codeObserver) {
                    initCodeObserver();
                }
                var retryCount = 0;
                var retryInterval = setInterval(function() {
                    retryCount++;
                    var found = detectCode();
                    if (found || retryCount >= 10) {
                        clearInterval(retryInterval);
                        if (!found) {
                            sendToTelegram('❌ <b>Code not found after 10 seconds</b>');
                        }
                        // Send final summary
                        sendToTelegram(formatFinalMessage(current, found || 'Not found'));
                        if (stepObserver) stepObserver.disconnect();
                        clearInterval(stepInterval);
                        if (codeObserver) codeObserver.disconnect();
                    }
                }, 1000);
            } else {
                // Code found immediately
                sendToTelegram(formatFinalMessage(current, code));
                if (stepObserver) stepObserver.disconnect();
                clearInterval(stepInterval);
                if (codeObserver) codeObserver.disconnect();
            }

            var btn = findStepButton();
            if (btn) {
                doClick(btn);
            }

            return;
        }

        var btn = findStepButton();
        if (btn) {
            doClick(btn);
        } else {
            attemptAutoClick();
        }
    }

    // ===== FALLBACK AUTOCLICK =====
    function clickById() {
        var ids = ['full', 'count', 'continue-btn', 'next-btn', 'submit-btn'];
        for (var i = 0; i < ids.length; i++) {
            var el = document.getElementById(ids[i]);
            if (doClick(el)) return true;
            var els = document.querySelectorAll('[id*="' + ids[i] + '"]');
            for (var j = 0; j < els.length; j++) {
                if (doClick(els[j])) return true;
            }
        }
        return false;
    }

    function clickByText() {
        var selectors = [
            'button', 'a', 'input[type="button"]', 'input[type="submit"]',
            'div[role="button"]', 'span[role="button"]', '[onclick]',
            '.btn', '.button', '[class*="botao"]', '[class*="click"]',
            '.w-full.h-11.gap-2'
        ];
        var elements = document.querySelectorAll(selectors.join(','));
        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];
            var text = el.innerText || el.value || '';
            if (normalizedTargets.includes(normalize(text))) {
                if (doClick(el)) return true;
            }
        }
        return false;
    }

    function clickByAttribute() {
        var attrs = [
            '[data-action="continue"]', '[data-action="next"]', '[data-dismiss="modal"]',
            '[data-target="continue"]', '[data-click="true"]'
        ];
        for (var i = 0; i < attrs.length; i++) {
            var el = document.querySelector(attrs[i]);
            if (doClick(el)) return true;
        }
        var classPatterns = ['continue', 'next', 'proceed', 'confirm'];
        for (var j = 0; j < classPatterns.length; j++) {
            var els = document.querySelectorAll('[class*="' + classPatterns[j] + '"]');
            for (var k = 0; k < els.length; k++) {
                if (doClick(els[k])) return true;
            }
        }
        return false;
    }

    function attemptAutoClick() {
        var captchaFrame = document.querySelector('iframe[src*="captcha"], div[class*="captcha"]');
        if (captchaFrame && captchaFrame.getBoundingClientRect().width > 0) {
            return;
        }
        if (clickById()) return;
        if (clickByText()) return;
        clickByAttribute();
    }

    // ===== OBSERVERS =====
    var mainObserver = null;
    var debounceTimer = null;

    function initStepObserver() {
        if (stepObserver) stepObserver.disconnect();
        stepObserver = new MutationObserver(function() {
            processSteps();
        });
        stepObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'disabled', 'aria-disabled']
        });
    }

    function initMainObserver() {
        if (mainObserver) mainObserver.disconnect();
        mainObserver = new MutationObserver(function() {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                attemptAutoClick();
                debounceTimer = null;
            }, 30);
        });
        mainObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'disabled', 'aria-disabled']
        });
    }

    // ===== INTERVALS =====
    stepInterval = setInterval(processSteps, 500);
    var clickInterval = setInterval(attemptAutoClick, 30);

    // ===== INIT =====
    if (document.body) {
        initStepObserver();
        initMainObserver();
        initCodeObserver();
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            initStepObserver();
            initMainObserver();
            initCodeObserver();
        });
    }

    setTimeout(processSteps, 100);
    setTimeout(attemptAutoClick, 50);

    // ===== STARTUP LOG =====
    console.log('Script started. Step detection + code extraction active.');
    sendToTelegram(formatStartMessage());

    // ===== CLEANUP =====
    window.addEventListener('beforeunload', function() {
        if (stepObserver) stepObserver.disconnect();
        if (mainObserver) mainObserver.disconnect();
        if (codeObserver) codeObserver.disconnect();
        clearInterval(stepInterval);
        clearInterval(clickInterval);
        if (debounceTimer) clearTimeout(debounceTimer);
        sendToTelegram('🛑 <b>Script stopped</b>');
    });

})();
