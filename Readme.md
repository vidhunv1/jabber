# Jabber

Messaging dapp built on Solana.

https://medium.com/solana-labs/announcing-the-winners-of-solanas-inaugural-hackathon-66a280b33e6

https://jabber-test.vercel.app

https://vimeo.com/479480751

## Private chats

- Send end-to-end encrypted messages to any valid Solana address. Your signing keys are converted to Curve25519 to be used in encrypting the messages.
- Cheap and real-time. Messages cost 0.0015 SOL for a tweet length message stored permanently. Temporary storage will be much cheaper(it will work like [disappearing messages](https://faq.whatsapp.com/general/chats/about-disappearing-messages/?lang=fb)!).

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
