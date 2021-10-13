import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import BN from "bn.js";
import { Schema, serialize } from "borsh";
import { MessageType } from "./state";

export const JABBER_ID = new PublicKey(
  "FddkMfjFoLdBeTbETr5uZobEkykeW76Nk24hghPPchpw"
);

export class CreateProfile {
  tag: number;
  name: string;
  bio: string;
  lamportsPerMessage: BN;

  static schema: Schema = new Map([
    [
      CreateProfile,
      {
        kind: "struct",
        fields: [
          ["tag", "u8"],
          ["name", "string"],
          ["bio", "string"],
          ["lamportsPerMessage", "u64"],
        ],
      },
    ],
  ]);

  constructor(obj: { name: string; bio: string; lamportsPerMessage: BN }) {
    this.tag = 0;
    this.name = obj.name;
    this.bio = obj.bio;
    this.lamportsPerMessage = obj.lamportsPerMessage;
  }

  serialize(): Uint8Array {
    return serialize(CreateProfile.schema, this);
  }

  getInstruction(
    profile: PublicKey,
    profileOwner: PublicKey,
    feePayer: PublicKey
  ) {
    const data = Buffer.from(this.serialize());
    const keys = [
      // Account 1
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      // Account 2
      {
        pubkey: profile,
        isSigner: false,
        isWritable: true,
      },
      // Account 3
      {
        pubkey: profileOwner,
        isSigner: true,
        isWritable: true,
      },
      // Account 4
      {
        pubkey: feePayer,
        isSigner: true,
        isWritable: true,
      },
    ];

    return new TransactionInstruction({
      keys,
      programId: JABBER_ID,
      data,
    });
  }
}

export class CreateThread {
  tag: number;
  sender: Uint8Array;
  receiver: Uint8Array;

  static schema: Schema = new Map([
    [
      CreateThread,
      {
        kind: "struct",
        fields: [
          ["tag", "u8"],
          ["sender", [32]],
          ["receiver", [32]],
        ],
      },
    ],
  ]);

  constructor(obj: { sender: Uint8Array; receiver: Uint8Array }) {
    this.tag = 1;
    this.sender = obj.sender;
    this.receiver = obj.receiver;
  }

  serialize(): Uint8Array {
    return serialize(CreateThread.schema, this);
  }

  getInstruction(thread: PublicKey, feePayer: PublicKey) {
    const data = Buffer.from(this.serialize());
    const keys = [
      // Account 1
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      // Account 2
      {
        pubkey: thread,
        isSigner: false,
        isWritable: true,
      },
      // Account 3
      {
        pubkey: feePayer,
        isSigner: true,
        isWritable: true,
      },
    ];

    return new TransactionInstruction({
      keys,
      programId: JABBER_ID,
      data,
    });
  }
}

export class SetUserProfile {
  tag: number;
  name: string;
  bio: string;
  lamportsPerMessage: BN;

  static schema: Schema = new Map([
    [
      SetUserProfile,
      {
        kind: "struct",
        fields: [
          ["tag", "u8"],
          ["name", "string"],
          ["bio", "string"],
          ["lamportsPerMessage", "u64"],
        ],
      },
    ],
  ]);

  constructor(obj: { name: string; bio: string; lamportsPerMessage: BN }) {
    this.tag = 2;
    this.name = obj.name;
    this.bio = obj.bio;
    this.lamportsPerMessage = obj.lamportsPerMessage;
  }

  serialize(): Uint8Array {
    return serialize(SetUserProfile.schema, this);
  }

  getInstruction(profileOwner: PublicKey, profile: PublicKey) {
    const data = Buffer.from(this.serialize());
    const keys = [
      // Account 1
      {
        pubkey: profileOwner,
        isSigner: true,
        isWritable: true,
      },
      // Account 2
      {
        pubkey: profile,
        isSigner: false,
        isWritable: true,
      },
    ];

    return new TransactionInstruction({
      keys,
      programId: JABBER_ID,
      data,
    });
  }
}

export class SendMessage {
  tag: number;
  kind: MessageType;
  message: Uint8Array;

  static schema: Schema = new Map([
    [
      SendMessage,
      {
        kind: "struct",
        fields: [
          ["tag", "u8"],
          ["kind", "u8"],
          ["message", ["u8"]],
        ],
      },
    ],
  ]);

  constructor(obj: { kind: MessageType; message: Uint8Array }) {
    this.tag = 3;
    this.kind = obj.kind;
    this.message = obj.message;
  }

  serialize(): Uint8Array {
    return serialize(SendMessage.schema, this);
  }

  getInstruction(
    sender: PublicKey,
    receiver: PublicKey,
    thread: PublicKey,
    receiverProfile: PublicKey,
    message: PublicKey
  ) {
    const data = Buffer.from(this.serialize());
    const keys = [
      // Account 1
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      // Account 2
      {
        pubkey: sender,
        isSigner: true,
        isWritable: true,
      },
      // Account 3
      {
        pubkey: receiver,
        isSigner: false,
        isWritable: true,
      },
      // Account 4
      {
        pubkey: thread,
        isSigner: false,
        isWritable: true,
      },
      // Account 5
      {
        pubkey: receiverProfile,
        isSigner: false,
        isWritable: false,
      },
      // Account 6
      {
        pubkey: message,
        isSigner: false,
        isWritable: true,
      },
    ];

    return new TransactionInstruction({
      keys,
      programId: JABBER_ID,
      data,
    });
  }
}
