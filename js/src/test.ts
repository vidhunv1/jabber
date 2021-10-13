import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import fs from "fs";
import { Profile, Thread, MessageType, Message } from "./state";
import { createThread, setUserProfile, sendMessage } from "./bindings";
import { encryptMessage, signAndSendTransactionInstructions } from "./utils";
import { decryptMessage } from "./utils";
import { JABBER_ID } from "./instructions";

const connection = new Connection("https://api.devnet.solana.com");

const wallet = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync("./wallet.json").toString()))
);

console.log(wallet.publicKey.toBase58());

const receiver = new PublicKey("rw1PaE5XHETK2V1TcL1TjWrrzbstngKXDfkJ49zue4w");

export const test = async () => {
  // Create thread
  //   const createThreadInstruction = await createThread(
  //     wallet.publicKey,
  //     receiver,
  //     wallet.publicKey
  //   );
  //   console.log(
  //     await signAndSendTransactionInstructions(connection, [], wallet, [
  //       createThreadInstruction,
  //     ])
  //   );
  // Retrieve Thread
  //   const thread = await Thread.retrieve(connection, wallet.publicKey, receiver);
  //   console.log(thread);
  //
  //
  // Retrieve profile
  //   const profile = await Profile.retrieve(connection, wallet.publicKey);
  //   console.log(profile);
  //
  //
  // Update profile
  //   const updatProfileInstruction = await setUserProfile(
  //     wallet.publicKey,
  //     "Test Name 2",
  //     "Test bio 2",
  //     10
  //   );
  //   console.log(
  //     await signAndSendTransactionInstructions(connection, [], wallet, [
  //       updatProfileInstruction,
  //     ])
  //   );
  //
  //
  // Send message
  //   const sendMessageInstruction = await sendMessage(
  //     connection,
  //     wallet.publicKey,
  //     receiver,
  //     Buffer.from("Coucou"),
  //     MessageType.Unencrypted
  //   );
  //   console.log(
  //     await signAndSendTransactionInstructions(connection, [], wallet, [
  //       sendMessageInstruction,
  //     ])
  //   );
  //
  //
  // Retrieve message
  // const message = await Message.retrieveFromIndex(
  //   connection,
  //   0,
  //   receiver,
  //   wallet.publicKey
  // );
  // console.log(Buffer.from(message.msg).toString());
};

test();
