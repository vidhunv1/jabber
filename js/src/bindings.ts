import {
  CreateProfile,
  JABBER_ID,
  CreateThread,
  SetUserProfile,
  SendMessage,
} from "./instructions";
import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { Profile, Thread, MessageType, Message } from "./state";
import { encryptMessage } from "./utils";

export const createProfile = async (
  profileOwner: PublicKey,
  name: string,
  bio: string,
  lamportsPerMessage: number
) => {
  const [profile] = await PublicKey.findProgramAddress(
    Profile.generateSeeds(profileOwner),
    JABBER_ID
  );
  const instruction = new CreateProfile({
    name: name,
    bio: bio,
    lamportsPerMessage: new BN(lamportsPerMessage),
  }).getInstruction(profile, profileOwner, profileOwner);

  return instruction;
};

export const createThread = async (
  sender: PublicKey,
  receiver: PublicKey,
  feePayer: PublicKey
) => {
  const [thread] = await PublicKey.findProgramAddress(
    Thread.generateSeeds(sender, receiver),
    JABBER_ID
  );

  const instruction = new CreateThread({
    sender: sender.toBuffer(),
    receiver: receiver.toBuffer(),
  }).getInstruction(thread, feePayer);

  return instruction;
};

export const setUserProfile = async (
  profileOwner: PublicKey,
  name: string,
  bio: string,
  lamportsPerMessage: number
) => {
  const [profile] = await PublicKey.findProgramAddress(
    Profile.generateSeeds(profileOwner),
    JABBER_ID
  );

  const instruction = new SetUserProfile({
    name: name,
    bio: bio,
    lamportsPerMessage: new BN(lamportsPerMessage),
  }).getInstruction(profileOwner, profile);

  return instruction;
};

export const sendMessage = async (
  connection: Connection,
  sender: PublicKey,
  receiver: PublicKey,
  message: Uint8Array,
  kind: MessageType
) => {
  const [receiverProfile] = await PublicKey.findProgramAddress(
    Profile.generateSeeds(receiver),
    JABBER_ID
  );
  const [threadAccount] = await PublicKey.findProgramAddress(
    Thread.generateSeeds(sender, receiver),
    JABBER_ID
  );

  const thread = await Thread.retrieve(connection, sender, receiver);

  const [messageAccount] = await PublicKey.findProgramAddress(
    Message.generateSeeds(thread.msgCount, sender, receiver),
    JABBER_ID
  );

  const instruction = new SendMessage({
    kind: kind,
    message: message,
  }).getInstruction(
    sender,
    receiver,
    threadAccount,
    receiverProfile,
    messageAccount
  );

  return instruction;
};
