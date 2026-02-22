import path from 'path';
import { file } from 'bun';

import HomePage from './public/index.html';
import CreatePage from './public/create.html';
import RetrivePage from './public/retrive.html';

function generateRandomID() {
    const allowerCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    function pick(str: string) {
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        return str[arr[0]! % str.length];
    }

    let result = [
        pick(allowerCharacters),
        pick(allowerCharacters),
        pick(allowerCharacters),
        pick(allowerCharacters),
        pick(allowerCharacters),
        pick(allowerCharacters)
    ];

    return result.join('');
}

// Base64 validation regex
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

const datas: {
    [key: string]: {
        [key: string]: number | string
    }
} = {};

// Note: rate limit & banned ips will be reset to blank once server is restarted
let RateLimits: {
    [key: string]: number
} = {};

let BannedIPs: string[] = [];

// Clear the rate limit list every minute
setInterval(() => {
    RateLimits = {};
}, 60000);

// Clear the banned ip list every 24 hours
setInterval(() => {
    RateLimits = {};
}, 86400);

const server: Bun.Server<unknown> = Bun.serve({
    routes: {
        '/': HomePage,
        '/create': CreatePage,
        '/retrive': RetrivePage,
        '/css/index.css': file(path.join(__dirname, 'public', 'css', 'index.css')),
        '/css/create.css': file(path.join(__dirname, 'public', 'css', 'create.css')),
        '/css/retrive.css': file(path.join(__dirname, 'public', 'css', 'retrive.css')),
        '/lib/encrypt.js': file(path.join(__dirname, 'public', 'lib', 'encrypt.js')),
        '/lib/decrypt.js': file(path.join(__dirname, 'public', 'lib', 'decrypt.js')),
        '/images/view-source-code-badge.svg': file(path.join(__dirname, 'images', 'view-source-code-badge.svg')),
    },
    async fetch(req) {
        if (req.method === 'POST') {
            console.log(req.headers);

            const ip_address = server.requestIP(req)?.address;

            // Check if IP address is present
            if (ip_address) {
                // Check if IP is banned
                if (BannedIPs.includes(ip_address)) {
                    return new Response(JSON.stringify({ success: false, error: 'Your IP has been banned!' }));
                }

                // Check if ip present in rate limit list
                const currRateLimit = RateLimits[ip_address];
                if (currRateLimit) {
                    RateLimits[ip_address]!++;

                    // Make sure IP doesn't cross rate limit
                    if (currRateLimit < 6) {
                    } else {
                        console.log(`IP Banned: ${ip_address}`);
                        BannedIPs.push(ip_address);
                    }
                } else {
                    RateLimits[ip_address] = 1;
                }
            }
        }


        const url = new URL(req.url);
        if (url.pathname === '/api/create' && req.method === 'POST') {
            try {
                // Vaildation that the keys are correct
                let test: any = await req.body?.json();

                const isValid =
                    test &&
                    typeof test === 'object' &&
                    Object.keys(test).length === 7 &&

                    /* General params releated */
                    // Check one_time parameter's value format
                    typeof test.one_time === 'boolean' &&

                    // Check expiry time
                    typeof test.expiry === 'number' &&
                    Number.isFinite(test.expiry) &&
                    test.expiry > 0 &&
                    test.expiry < 241 &&

                    /* Encryption related */
                    // version check
                    test.v === 1 &&

                    // iterations sanity check
                    typeof test.i === 'number' &&
                    Number.isFinite(test.i) &&
                    test.i > 100000 &&
                    test.i < 500000 &&

                    // salt (24 base64 chars)
                    typeof test.s === 'string' &&
                    test.s.length === 24 &&
                    BASE64_RE.test(test.s) &&

                    // iv (16 base64 chars)
                    typeof test.iv === 'string' &&
                    test.iv.length === 16 &&
                    BASE64_RE.test(test.iv) &&

                    // ciphertext (variable length)
                    typeof test.d === 'string' &&
                    test.d.length >= 24 &&
                    BASE64_RE.test(test.d);
                if (isValid) {
                    const accessID = generateRandomID();
                    datas[accessID] = test;

                    // Set expiry time
                    setTimeout(() => {
                        delete datas[accessID];
                    }, 60000 * test.expiry);

                    return new Response(JSON.stringify({ success: true, accessID }));
                } else {
                    return new Response(JSON.stringify({ success: false, error: 'Failed to validate!' }));
                }
            } catch (e) {
                console.error(e);
                return new Response(JSON.stringify({ success: false, error: 'Something went wrong!' }));
            }
        } else if (url.pathname === '/api/retrive' && req.method === 'POST') {
            const body = await req.body?.json();
            // Validation
            if (body && body.accessID.trim().length == 6) {
                const data = datas[body.accessID];
                if (data) {
                    // Delete it if it's one time secret
                    if (data.one_time) {
                        delete datas[body.accessID];
                    }

                    return new Response(JSON.stringify({ success: true, encrypted: JSON.stringify(data) }));
                } else {
                    return new Response(JSON.stringify({ success: false, error: 'Incorrect/Expired access id!' }));
                }
            } else {
                return new Response(JSON.stringify({ success: false, error: 'Missing/Incorrect body!' }));
            }
        }

        return new Response('NOT FOUND!');
    },
    port: 3000,
    reusePort: true
});

console.log('Secret Sharer started on port 3000!');