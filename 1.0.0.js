// ==UserScript==
// @name         Anti-Disable-devtool
// @namespace    https://github.com/Moushudyx
// @version      1.0.0
// @description  An anti-disable-devtool tool. Err, I mean, anti-disable-devtool is a tool that, errrrrr, anti disable-devtool
// @author       Moushu
// @match        https://theajack.github.io/disable-devtool*
// @match        https://xinghuo.xfyun.cn/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function(window) {
    'use strict';
    // 缓存原生的函数, 下一步就是劫持它们 Cache the native functions, and the next step is to hijack them.
    const window_close = window.close;
    const log = console.log;
    const error = console.error;
    const warn = console.warn;
    const table = console.table;
    const clear = console.clear;
    const _setInterval = window.setInterval;
    const fn2String= Function.prototype.toString
    const obj2String = Object.prototype.toString

    hijackingConsole()
    disableClose()

    log('[Anti-Disable-devtool] 已处理 Handled')

    /** 干掉关闭页面的逻辑 Stop window from closing */
    function disableClose() {
        window.close = () => { debugger } // 紧 急 中 止 EMERGENCY STOP
    }
    /** 劫持`console` 和 `setInterval` Hijack `console` and `setInterval` */
    function hijackingConsole() {
        window.console.log = hijackingNativeFn(console.log, (...args) => {
            new Promise((res) => res()).then(() => {
                log(...filterArgs(args))
            })
        })
        log('[Anti-Disable-devtool] 劫持 Hijack console.log:\n', fn2String.call(console.log))
        window.console.error = hijackingNativeFn(console.error, (...args) => {
            new Promise((res) => res()).then(() => {
                error(...filterArgs(args))
            })
        })
        window.console.warn = hijackingNativeFn(console.warn, (...args) => {
            new Promise((res) => res()).then(() => {
                warn(...filterArgs(args))
            })
        })
        window.console.table = hijackingNativeFn(console.table, (...args) => {
            new Promise((res) => res()).then(() => {
                table(...filterArgs(args))
            })
        })
        window.console.clear = hijackingNativeFn(console.clear, (...args) => {
            // debugger;
            // log('有笨蛋');
            return;
        })
        window.setInterval = hijackingNativeFn(window.setInterval, (...args) => {
            if (typeof args[0] === 'function') {
                if (/[^a-zA-Z]debugger[^a-zA-Z]/.test(fn2String.call(args[0]))) return 1
            }
            return _setInterval(...args)
        })
    }
    /** 劫持时需要伪装自身 Pretend to be a native function */
    function hijackingNativeFn(fn, insertFn) {
        const originString = fn.toString();
        const hijackingFn = (...args) => {
            'function () { [native code] }';
            if (insertFn) return insertFn(...args)
        }
        Object.defineProperty(hijackingFn, "name", { enumerable: false, value: fn.name })
        hijackingFn.mark = "moushu hijacked";
        const hijackingToString = () => { 'function toString() { [native code] }'; return originString };
        hijackingFn.toString = fn.hijackingToString;
        return hijackingFn
    }
    /** 过滤那些更改了 toString 来钓鱼的 Filter object that modded toString fn */
    function isModToString(fn) {
        if (!fn) return false;
        if (typeof fn.toString !== 'function') return true;
        if (!/\[\s?native code\s?\]/.test(fn2String.call(fn.toString))) return true
        return false;
    }
    /** 过滤那些更改了 id 来钓鱼的 Filter object that modded id fn */
    function isDangerousId(el) {
        if (!el) return false;
        if (typeof el !== 'object') return false;
        if (el.__lookupGetter__) {
            if (typeof el.__lookupGetter__('id') === 'function') return true;
        }
        if (Object.getOwnPropertyDescriptor(el, 'id')?.get) return true;
        return false;
    }
    /** 过滤测试性能的参数 Filter object that used for performance testing */
    function isTestArray(obj) {
        if (!obj || typeof obj !== "object") return false;
        if (Object.keys(obj).length >= 250) return true;
        if (Array.isArray(obj) && obj.length >= 25 && obj[0] && typeof obj[0] === 'object' && Object.keys(obj[0]).length >= 250) return true;
        return false;
    }
    /** 劫持 console 时需保证正常工作，这里需过滤危险参数 To hijack console doesnot mean to disable it but filter weird arguments */
    function filterArgs(args) {
        const res = []
        for (let i = 0; i < args.length; i++) {
            const arg = args[i]
            if (isModToString(arg) || isTestArray(arg) || isDangerousId(arg)) {
                continue;
            }
            res.push(arg)
        }
        return res;
    }
})(window);
