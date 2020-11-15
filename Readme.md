# Jabber

Messaging dapp built on Solana.

https://jabber-test.vercel.app

Contact me: (D2T7LaEp7SgQCZWvxbMfWym6LW2cSfX69oXpFLCDqbVS)

## Private chats

- Send end-to-end encrypted messages to any valid Solana address. Encryption is done by converting your signing keys to Curve25519 to be used in encrypting you messages.
- Cheap and real-time. Messages cost 0.0015 SOL for a tweet length message stored permanently. Temporary storage will be much cheaper(it will work like [disappearing messages](https://faq.whatsapp.com/general/chats/about-disappearing-messages/?lang=fb)!).
- (WIP) Get paid to receive messages. Similar to what [earn-dot-com](https://news.earn.com/get-paid-to-read-email-from-outside-your-network-with-a-21-profile-8a388548a9ef) did for emails.

## Group chats

- The creator pays and allocates for storage(upto 10MB) for the group, when storage is full the oldest messages are recycled. When sending messages you only pay the computation costs.

# Installation

Requires `node`, `yarn`, `docker`, `cargo`

- `cd web && yarn install`
- Run the solana localnode `yarn localnet:up`
- Create account `yarn sol:account:create`
- Get airdrops `yarn sol:account:airdrop`
- Deploy program `yarn sol:program:deploy`
- Copy the programId to `web/config.ts`
- Run app `yarn dev`
