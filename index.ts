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
} = {
    pd9G5H: {
        v: 1,
        i: 210000,
        s: "iaZm6zH9//oKtzz6iIClcg==",
        iv: "xJO4Pw0bd2kpLKXF",
        d: "V5xEIsxwcK/tON+pV4xun5W6AJ3pSbVkdzai",
    },
};

Bun.serve({
    routes: {
        '/': HomePage,
        '/create': CreatePage,
        '/retrive': RetrivePage,
        '/css/index.css': file(path.join(__dirname, 'public', 'css', 'index.css')),
        '/css/create.css': file(path.join(__dirname, 'public', 'css', 'create.css')),
        '/css/retrive.css': file(path.join(__dirname, 'public', 'css', 'retrive.css')),
        '/lib/encrypt.js': file(path.join(__dirname, 'public', 'lib', 'encrypt.js')),
        '/lib/decrypt.js': file(path.join(__dirname, 'public', 'lib', 'decrypt.js')),
    },
    async fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === '/api/create' && req.method === 'POST') {
            try {
                // Vaildation that the keys are correct
                let test: any = await req.body?.json();

                const isValid =
                    test &&
                    typeof test === 'object' &&
                    Object.keys(test).length === 5 &&

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
                    return new Response(JSON.stringify({ success: true, encrypted: JSON.stringify(data) }));
                } else {
                    return new Response(JSON.stringify({ success: false, error: 'Incorrect access id!' }));
                }
            } else {
                return new Response(JSON.stringify({ success: false, error: 'Missing/Incorrect body!' }));
            }
        }

        return new Response('NOT FOUND!');
    },
    port: 3000
});

console.log('Secret Sharer started on port 3000!');