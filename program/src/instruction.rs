use crate::processor::{create_profile, create_thread, send_message, set_user_profile};

use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum JabberInstruction {
    // Accounts expected by this insctruction
    //
    // | Index | Writable | Signer | Description           |
    // |-------|----------|--------|-----------------------|
    // | 0     | ❌        | ❌      | System program        |
    // | 1     | ✅        | ❌      | Profile account       |
    // | 2     | ✅        | ✅      | Profile account owner |
    CreateProfile(create_profile::Params),
    //     | Index | Writable | Signer | Description    |
    // |-------|----------|--------|----------------|
    // | 0     | ❌        | ❌      | System program |
    // | 1     | ✅        | ❌      | Thread account |
    // | 2     | ✅        | ✅      | Fee payer      |
    CreateThread(create_thread::Params),
    //
    // Accounts expected by this instruction
    //
    // | Index 	| Writable 	| Signer 	| Description          	|
    // |-------	|----------	|--------	|----------------------	|
    // | 0     	| ❌        	| ✅      	| User                 	|
    // | 1     	| ✅        	| ❌      	| User profile account 	|
    SetUserProfile(set_user_profile::Params),
    //
    // Accounts expected by this instruction
    //
    // | Index 	| Writable 	| Signer 	| Description              	|
    // |-------	|----------	|--------	|--------------------------	|
    // | 0     	| ❌        	| ❌      	| System program           	|
    // | 1     	| ❌        	| ✅      	| Sender account           	|
    // | 2     	| ❌        	| ❌      	| Receiver account         	|
    // | 3     	| ✅        	| ❌      	| Thread account         	|
    // | 4     	| ❌       	| ❌      	| Receiver profile        	|
    // | 5     	| ✅        	| ❌      	| Message account          	|
    SendMessage(send_message::Params),
}

// #[cfg(test)]
// mod test {
//     use super::*;
//     use solana_program::{clock::Epoch, pubkey::Pubkey};

//     fn rand_pk() -> Pubkey {
//         Pubkey::new(&rand::random::<[u8; 32]>())
//     }

//     fn sys_pk() -> Pubkey {
//         let system_account_bytes: &[u8] = &[
//             0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
//             0, 0, 0,
//         ];
//         Pubkey::new(system_account_bytes)
//     }

//     fn create_account<'a>(
//         is_signer: bool,
//         is_writable: bool,
//         pk: &'a Pubkey,
//         owner: &'a Pubkey,
//         lamports: &'a mut u64,
//         data: &'a mut [u8],
//     ) -> AccountInfo<'a> {
//         AccountInfo::new(
//             &pk,
//             is_signer,
//             is_writable,
//             lamports,
//             data,
//             &owner,
//             false,
//             Epoch::default(),
//         )
//     }

//     #[test]
//     fn test_send_message() {
//         let mut s_data = vec![0];
//         let mut r_data = vec![0];
//         let mut s_thread_data = vec![0; Thread::MIN_SPACE];
//         let mut r_thread_data = vec![0; 0];
//         let mut s_profile_data = vec![0; Profile::MIN_SPACE];
//         let mut r_profile_data = vec![0];
//         let mut msg_data = vec![0; 100];
//         let mut jabber_data = vec![0; 100];
//         let mut pks = [rand_pk(), rand_pk(), rand_pk(), rand_pk(), rand_pk()];
//         send_message(
//             String::from("Hey!"),
//             1,
//             pks,
//             &mut s_data,
//             &mut r_data,
//             &mut s_thread_data,
//             &mut r_thread_data,
//             &mut s_profile_data,
//             &mut r_profile_data,
//             &mut msg_data,
//             &mut jabber_data,
//         );

//         let msg = Message::unpack(&msg_data).unwrap();
//         let expected_msg = Message {
//             kind: 10,
//             msg: String::from("Hey!").into_bytes(),
//             timestamp: 0,
//         };
//         let jabber = Jabber::unpack(&jabber_data).unwrap();
//         let s_thread = Thread::unpack(&s_thread_data).unwrap();
//         let expected_s_thread = Thread {
//             msg_count: 2,
//             prev_thread_u1_pk: None,
//             prev_thread_u2_pk: None,
//             u1_pk: pks[1].to_bytes(),
//             u2_pk: pks[2].to_bytes(),
//         };
//         let thread_pk = Thread::create_with_seed(&pks[1], &pks[2], &pks[0]).unwrap();
//         assert_eq!(expected_msg, msg, "Test message");
//         assert_eq!(
//             jabber.unregistered_thread_tail_pk,
//             Some(thread_pk.to_bytes()),
//             "Test jabber tail thread"
//         );
//         assert_eq!(expected_s_thread, s_thread, "Test s_thread");

//         msg_data = vec![0; 100];
//         send_message(
//             String::from("What's up?"),
//             2,
//             pks,
//             &mut s_data,
//             &mut r_data,
//             &mut s_thread_data,
//             &mut r_thread_data,
//             &mut s_profile_data,
//             &mut r_profile_data,
//             &mut msg_data,
//             &mut jabber_data,
//         );

//         let msg = Message::unpack(&msg_data).unwrap();
//         let expected_msg = Message {
//             kind: 10,
//             msg: String::from("What's up?").into_bytes(),
//             timestamp: 0,
//         };
//         let jabber = Jabber::unpack(&jabber_data).unwrap();
//         let s_thread = Thread::unpack(&s_thread_data).unwrap();
//         let expected_s_thread = Thread {
//             msg_count: 3,
//             prev_thread_u1_pk: None,
//             prev_thread_u2_pk: None,
//             u1_pk: pks[1].to_bytes(),
//             u2_pk: pks[2].to_bytes(),
//         };

//         assert_eq!(expected_msg, msg);
//         assert_eq!(
//             jabber.unregistered_thread_tail_pk,
//             Some(thread_pk.to_bytes())
//         );
//         assert_eq!(expected_s_thread, s_thread);

//         // Send message to another account whose profile is registered
//         s_thread_data = vec![0; Thread::MIN_SPACE];
//         pks[2] = rand_pk();
//         let thread_pk = Thread::create_with_seed(&pks[1], &pks[2], &pks[0]).unwrap();
//         r_profile_data = vec![0; Profile::MIN_SPACE];
//         Profile::default().pack(&mut r_profile_data);
//         msg_data = vec![0; 100];
//         send_message(
//             String::from("bye"),
//             1,
//             pks,
//             &mut s_data,
//             &mut r_data,
//             &mut s_thread_data,
//             &mut r_thread_data,
//             &mut s_profile_data,
//             &mut r_profile_data,
//             &mut msg_data,
//             &mut jabber_data,
//         );
//         let mut expected_r_profile = Profile::default();
//         expected_r_profile.thread_tail_pk = Some(thread_pk.to_bytes());
//         let r_prrofile = Profile::unpack(&r_profile_data).unwrap();
//         assert_eq!(expected_r_profile, r_prrofile);

//         // When Thread is available on receiver
//         r_thread_data = vec![0; Thread::MIN_SPACE];
//         Thread {
//             msg_count: 2,
//             prev_thread_u1_pk: None,
//             prev_thread_u2_pk: None,
//             u1_pk: pks[1].to_bytes(),
//             u2_pk: pks[2].to_bytes(),
//         }
//         .pack(&mut r_thread_data);
//         s_thread_data = vec![0; 0];
//         send_message(
//             String::from("Hello"),
//             2,
//             pks,
//             &mut s_data,
//             &mut r_data,
//             &mut s_thread_data,
//             &mut r_thread_data,
//             &mut s_profile_data,
//             &mut r_profile_data,
//             &mut msg_data,
//             &mut jabber_data,
//         );
//         assert_eq!(Thread::unpack(&r_thread_data).unwrap().msg_count, 3);

//         // TODO: Check s_last_thread_data for all cases
//     }
//     fn send_message(
//         msg: String,
//         msg_index: u32,
//         pks: [Pubkey; 5],
//         mut s_data: &mut Vec<u8>,
//         mut r_data: &mut Vec<u8>,
//         mut s_thread_data: &mut Vec<u8>,
//         mut r_thread_data: &mut Vec<u8>,
//         mut s_profile_data: &mut Vec<u8>,
//         mut r_profile_data: &mut Vec<u8>,
//         mut msg_data: &mut Vec<u8>,
//         mut jabber_data: &mut Vec<u8>,
//     ) {
//         let mut pks_iter = pks.iter();
//         let program_id = pks_iter.next().unwrap();
//         let owner = sys_pk();
//         let mut lamports = 0;
//         let s_pk = pks_iter.next().unwrap();
//         // 0
//         let s_acc = create_account(true, true, &s_pk, &owner, &mut lamports, &mut s_data);
//         let mut lamports = 0;
//         let r_pk = pks_iter.next().unwrap();
//         // 1
//         let r_acc = create_account(false, false, &r_pk, &owner, &mut lamports, &mut r_data);
//         let mut lamports = 10000000;
//         let s_thread_pk = Thread::create_with_seed(&s_pk, &r_pk, &program_id).unwrap();
//         // 2
//         let s_thread_acc = create_account(
//             false,
//             false,
//             &s_thread_pk,
//             &program_id,
//             &mut lamports,
//             &mut s_thread_data,
//         );
//         let mut lamports = 10000000;
//         let r_thread_pk = Thread::create_with_seed(&r_pk, &s_pk, &program_id).unwrap();
//         // 3
//         let r_thread_acc = create_account(
//             false,
//             false,
//             &r_thread_pk,
//             &program_id,
//             &mut lamports,
//             &mut r_thread_data,
//         );
//         let mut lamports = 0;
//         Profile::default().pack(&mut s_profile_data);
//         let s_profile_pk = Profile::create_with_seed(&s_pk, &program_id).unwrap();
//         // 4
//         let s_profile_acc = create_account(
//             false,
//             false,
//             &s_profile_pk,
//             &program_id,
//             &mut lamports,
//             &mut s_profile_data,
//         );
//         let mut lamports = 0;
//         let r_profile_pk = Profile::create_with_seed(&r_pk, &program_id).unwrap();
//         // 5
//         let r_profile_acc = create_account(
//             false,
//             false,
//             &r_profile_pk,
//             &program_id,
//             &mut lamports,
//             &mut r_profile_data,
//         );

//         let mut lamports = 0;
//         let message_pk = Message::create_with_seed(msg_index, &s_pk, &r_pk, &program_id).unwrap();
//         // 6
//         let message_acc = create_account(
//             false,
//             false,
//             &message_pk,
//             &owner,
//             &mut lamports,
//             &mut msg_data,
//         );
//         let mut lamports = 0;
//         let jabber_pk = Jabber::get_account(program_id).unwrap();
//         // 7
//         let jabber_acc = create_account(
//             false,
//             false,
//             &jabber_pk,
//             &owner,
//             &mut lamports,
//             &mut jabber_data,
//         );

//         let rent = Rent {
//             lamports_per_byte_year: 10,
//             exemption_threshold: 2.0,
//             burn_percent: 5,
//         };
//         let rent_account = rent.create_account(1);
//         let rent_pubkey = solana_program::sysvar::rent::id();
//         let mut rent_tuple = (rent_pubkey, rent_account);
//         // 8
//         let rent_info = AccountInfo::from(&mut rent_tuple);

//         let c = solana_program::clock::Clock::default();
//         let clock_account = c.create_account(1);
//         let clock_pubkey = solana_program::sysvar::clock::id();
//         let mut clock_tuple = (clock_pubkey, clock_account);
//         let clock_info = AccountInfo::from(&mut clock_tuple);
//         let accounts = [
//             s_acc,
//             r_acc,
//             s_thread_acc,
//             r_thread_acc,
//             s_profile_acc,
//             r_profile_acc,
//             message_acc,
//             jabber_acc,
//             rent_info.clone(),
//             clock_info.clone(),
//         ];

//         let instruction = JabberInstruction::SendMessage {
//             kind: 10,
//             msg: msg.into_bytes(),
//         };
//         JabberInstruction::process(&program_id, &accounts, &instruction.try_to_vec().unwrap())
//             .unwrap();
//     }

//     #[test]
//     fn set_user_profile() {
//         let program_id = rand_pk();
//         let signer_account_pk = Pubkey::new(&[
//             178, 171, 88, 132, 51, 181, 205, 183, 31, 94, 121, 0, 179, 9, 133, 234, 102, 162, 50,
//             170, 249, 36, 249, 137, 57, 1, 205, 63, 49, 201, 228, 25,
//         ]);
//         let mut lamports = 0;
//         let mut data = vec![0; 0];
//         let owner = sys_pk();
//         let signer_account = create_account(
//             true,
//             false,
//             &signer_account_pk,
//             &owner,
//             &mut lamports,
//             &mut data,
//         );
//         let profile_account_pk =
//             Profile::create_with_seed(&signer_account_pk, &program_id).unwrap();
//         let mut profile_account_data = vec![0; 300];
//         let mut lamports = 0;
//         let profile_account = create_account(
//             false,
//             true,
//             &profile_account_pk,
//             &program_id,
//             &mut lamports,
//             &mut profile_account_data,
//         );
//         let accounts = [signer_account, profile_account];

//         let instruction = JabberInstruction::SetUserProfile {
//             name: Some("Alpaca".into()),
//             bio: Some("paca paca".into()),
//             lamports_per_message: None,
//         };
//         let instruction_data = instruction.try_to_vec().unwrap();
//         JabberInstruction::process(&program_id, &accounts, &instruction_data).unwrap();
//         let decoded_profile = Profile::unpack(&accounts[1].data.try_borrow().unwrap()).unwrap();
//         assert_eq!(decoded_profile.name, Some("Alpaca".into()));
//         assert_eq!(decoded_profile.bio, Some("paca paca".into()));
//         assert_eq!(decoded_profile.lamports_per_message, 0);

//         let instruction = JabberInstruction::SetUserProfile {
//             name: None,
//             bio: Some("hey!".into()),
//             lamports_per_message: Some(10),
//         };
//         let instruction_data = instruction.try_to_vec().unwrap();
//         JabberInstruction::process(&program_id, &accounts, &instruction_data).unwrap();
//         let decoded_profile = Profile::unpack(&accounts[1].data.try_borrow().unwrap()).unwrap();
//         assert_eq!(decoded_profile.name, Some("Alpaca".into()));
//         assert_eq!(decoded_profile.bio, Some("hey!".into()));
//         assert_eq!(decoded_profile.lamports_per_message, 10);
//     }
// }
