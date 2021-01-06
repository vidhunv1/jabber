# Jabber

## Abstract

An on-chain messaging protocol that allows any kind of messages to be sent between crypto addresses. This document goes into some of the protocol spec for private chat, end-to-end encryption, PubSub and push notifications.

We also explore the technical design that allows sending and delivering messages on the Solana network with speed and low cost.

## Introduction

Public blockchains have popularized the use of self-sovereign identities, this is an improvement over centralized systems which lack interoperability, privacy and security. Today the most popular applications making use of this is decentralized finance, with advancement in modern blockchain with speed and cost we could see growth in the broader web3 applications.

The shift from emails to crypto identities in web3 applications has made it hard for web3 applications to communicate with their users in a decentralized way. A PubSub between protocols and users would allow communication of important alerts like liquidations, DEX trades, governance, marketing etc.

The protocol is designed to be used for async communication, your public keys become the first point of contact for users and services in the web3 ecosystem.

## Core components

1. **Messaging protocol** - The program and interface for on-chain messaging including 1-1 messages, PubSub and public groups.
2. **Push notification nodes** - A decentralized network of nodes that acts as a bridge between the blockchain and centralized systems for push notifications(browser notifications, email, FCM, APNS, SMS).
3. **Clients** - Web UI, JS & mobile SDK's with a simple interface for developers to send and receive on-chain messages.

## Specification

### 1. Thread

Threads stores info on the interaction between accounts. 

When two id's interact for the first time, the sender should create this thread account. Clients subscribe to this account to get notified of any new message for the thread.

This is a derived account created by `create_account_with_seed(receiver_pk, sender_pk)`[1].

If the account already exists, it means that an interaction has already happened, otherwise the sender is rerquired to create it before any messages can be sent.

All thread accounts need to be rent exempted[2].

```
u1: Public key of user1.
u2: Public key of user2.
prev_thread_u1: The previous chat thread for user1.
prev_thread_u2: The previous chat thread for user2.
msg_index: Last index of message
meta: Array to record thread state like chat state indicators.
u1_ban: Indicates if user1 has banned this thread. This field can only be changed by user1.
u2_ban: Indicates if user2 has banned this thread. This field can only be changed by user2.
```

### 2. Message

This is a derived account, created by `create_account_with_seed(sender_pk, <message_index + receiver_pk>)`.
`message_index` is the next message index that is available on the thread account.

To reduce costs of sending messages, the account is not required to be rent exempt[2]. Messages only need to be available on-chain for enough time for the push notification nodes or clients to read the message. This makes sending messages really cheap[3]. Storage rent for 3-6 days might be ideal(~$1 per 40k messages of 280 bytes), the actual number can be determined based on live data or configured by the client if permanent storage is necessary.

Clients can query any message by deriving the message account starting from `msg_index` until 0.

```
data:  [required] The message data.
type:  [required] Kind of the message data. This field determines how the data field is interpreted. This field can be used to extend to additional message types.
meta:  [optional] Array of message metadata, this field can be used to append read receipts, reactions etc.
timestamp: [read-only] Unix timestamp set directly by the program
prev_msg: [optional] The public key of the parent message.
```

Message types:

```
0: Text message
1: CTA message
  title: Notification title
  body: The message body
  delivery: Timestamp to deliver the message. The push notification nodes should only send the notification after this time has passed.
2: Plain text message
  data: Message content
3: Encrypted message
  data: Encrypted message content
```

For simplicity, the Ed25519 signing key pair is converted into Curve25519. This means that by exchanging only 32-byte Ed25519 public keys users can both sign and encrypt without the clients having to manage custom RSA keys.

**Security** https://crypto.stackexchange.com/questions/3260/using-same-keypair-for-diffie-hellman-and-signing/3311#3311

### 3. vCard

vCard stores the identity related metadata for the user. It is possible to integrate thrid-party identity systems as long as they allow some form of key-value storrage. 

vCards works similar to a domain system, the program has the authority to delegate top level domain names. Jabber will use `.one` domains for user identity. It will be possible for anyone to create a namespace on this domain and any number of subdomains. 

Account for `alice.one`:

```
public_key: [required] The user's public key
name: [optional]
bio: [optional]
website: [optional]
thread_tail_pk: The public key of the last chat thread
<key>: <value>
...
...
```

Clients can iterate through the linked thread list starting from `thread_tail_pk` to get the list of all chat threads. Clients can subscribe to this account to watch for new chat threads using `thread_tail_pk`.

### 4. PubSub

TBD

## Milestones

### Private messaging
Protocol and web gui for managing your identity and receiving private messages.
- Messaging protocol - In progress
- vCard / identity - In progress
- JS client SDK
- Web GUI
- Push notification node
- Mobile apps

### Integrations
As Solana ecosystem grows and more applications launched, we will be working on useful integrations to become the communication infrastructure for all web3 applications.
- Channels / PubSub
- Public chat rooms


[1] - https://docs.solana.com/developing/programming-model/accounts#creating

[2] - https://docs.solana.com/developing/programming-model/accounts#rent-exemption

[3] - https://docs.solana.com/developing/programming-model/accounts#calculation-of-rent
