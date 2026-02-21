# Secret Sharer
This is a very simple & lightweight secret sharing tool focused on maximum security when sharing secrets.

## What's the purpose
Until now I haven't found a reliable way to share secrets like passwords, environment variables, 2FA backup codes, etc. There's always a big concern of privacy that your secrets may get leaked. Big tech has been logging everything, even a CTRL + V that you do. Tired of all this, I decided to create my own very secure secret sharing tool that I can use to share secrets to anyone extremely trustingly & reliably.

## Why should I use this?
![](./images/how-it-works.png)
This tool uses various techniques to safegard your data like:
- Zero knowledge encryption: The server has no clue about your decryption key.
- Multi layer encryption: Password itself is encrypted before encrypting the content with it. This makes brute forcing practically impossible.
- Zero knowledge about content: The server doesn't know what you're storing.
- Zero persistent storage: No data is stored persistent. All data is stored in memory protecting from hypervisor level attacks.
- Extremely lightweight: Can be used easily even on a 512MB RAM server!
- Zero config: There is no configuration required at all to run this. No environment variables, no cli arguments, nothing!
- No 3rd party stuff: There is no 3rd party dependencies on the server which improves security massively from supply-chain attacks.
- Operations happen client-side: All the encryption and decryption happens client-side. This improves security massively since no one can read your secret during transmission to the server.

TLDR; Everything is stored in the memory in an encrypted form. This means that even if somehow (almost impossible) if your memory is dumped at a physical/administrator level, your data is still practically impossible to crack due to the sheer amount of encryption layers and algorithms. Along with that, this tool is absolutely simple to setup as well as it doesn't require any configuration.


## Self hosting
NOTE: When self hosting keep in mind that once the server stops, all data is lost. This means that if suppose you make an update, all data shall be lost to blank. This is because no persistent storage is used.

### Binary (Recommended)
This is the easiest & most optimized way to use this tool. This doesn't require anything to be installed beforehand. All you need is to head over to the release section, download the binary that suits your platform & run it.

### Docker
Requirement: Git, Docker

A Dockerfile is present to make using it on Docker platform easier. It can be easily deployed on platforms like Dokploy as well.

### Bun
Requirement: Git, Bun
```
git clone https://github.com/sancho1952007/secret-sharer
cd secret-sharer
bun install --production
bun start
```